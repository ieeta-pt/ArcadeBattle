package ua.pt.App;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.OutputStreamWriter;
import java.io.Writer;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;


import org.opencv.android.BaseLoaderCallback;
import org.opencv.android.CameraBridgeViewBase.CvCameraViewFrame;
import org.opencv.android.JavaCameraView;
import org.opencv.android.LoaderCallbackInterface;
import org.opencv.android.OpenCVLoader;
import org.opencv.core.Core;
import org.opencv.core.CvType;
import org.opencv.core.Mat;
import org.opencv.core.MatOfInt;
import org.opencv.core.MatOfPoint;
import org.opencv.core.MatOfPoint2f;
import org.opencv.core.Point;
import org.opencv.core.Rect;
import org.opencv.core.RotatedRect;
import org.opencv.core.Scalar;
import org.opencv.core.Size;
import org.opencv.android.CameraBridgeViewBase;
import org.opencv.android.CameraBridgeViewBase.CvCameraViewListener2;
import org.opencv.imgproc.Imgproc;

import android.Manifest;
import android.app.Activity;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.graphics.Camera;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.os.Bundle;
import android.support.v4.app.ActivityCompat;
import android.util.Log;
import android.view.MotionEvent;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.view.View.OnTouchListener;
import android.view.SurfaceView;
import android.widget.Toast;

import ua.pt.Auxiliar.CameraOffsetCalc;
import ua.pt.OpenCv.CenterOfMass;
import ua.pt.OpenCv.ColorBlobDetector;
import ua.pt.OpenCv.HullPointsGenerator;

public class MainActivity extends Activity implements OnTouchListener, CvCameraViewListener2 {
    private static final String  TAG              = "MainActivity";

    private boolean              mIsColorSelected = false;
    private Mat                  mRgba;
    private Scalar               mBlobColorRgba;
    private Scalar               mBlobColorHsv;
    private ColorBlobDetector mDetector;
    private Mat                  mSpectrum;
    private Size                 SPECTRUM_SIZE;
    private Scalar               CONTOUR_COLOR;

    private int[] resolution = new int[] {640,480};
    private int frameCounter = 0;
    private int numWrites = 0;
    private CameraOffsetCalc cameraOffsetCalc;

    private JavaCameraView mOpenCvCameraView;

    private BaseLoaderCallback  mLoaderCallback = new BaseLoaderCallback(this) {
        @Override
        public void onManagerConnected(int status) {
            switch (status) {
                case LoaderCallbackInterface.SUCCESS:
                {
                    Log.i(TAG, "OpenCV loaded successfully");
                    mOpenCvCameraView.setMaxFrameSize(resolution[0], resolution[1]);
                    cameraOffsetCalc = new CameraOffsetCalc(resolution);

                    mOpenCvCameraView.enableView();
                    mOpenCvCameraView.setOnTouchListener(MainActivity.this);
                } break;
                default:
                {
                    super.onManagerConnected(status);
                } break;
            }
        }
    };

    public MainActivity() {
        Log.i(TAG, "Instantiated new " + this.getClass());
    }

    /** Called when the activity is first created. */
    @Override
    public void onCreate(Bundle savedInstanceState)
    {
        Log.i(TAG, "called onCreate");
        super.onCreate(savedInstanceState);
        requestWindowFeature(Window.FEATURE_NO_TITLE);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);

        setContentView(R.layout.main);

        // Request Camera access
        ActivityCompat.requestPermissions(MainActivity.this,
                new String[]{Manifest.permission.CAMERA},
                0);

        // Horizontal Activity
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);

        mOpenCvCameraView = (JavaCameraView) findViewById(R.id.color_blob_detection_activity_surface_view);
        mOpenCvCameraView.setCameraIndex(1);
        mOpenCvCameraView.setVisibility(SurfaceView.VISIBLE);

        mOpenCvCameraView.setCvCameraViewListener(this);
        mOpenCvCameraView.enableFpsMeter();
    }

    @Override
    public void onPause()
    {
        super.onPause();
        if (mOpenCvCameraView != null)
            mOpenCvCameraView.disableView();
    }

    @Override
    public void onResume()
    {
        super.onResume();
        if (!OpenCVLoader.initDebug()) {
            Log.d(TAG, "Internal OpenCV library not found. Using OpenCV Manager for initialization");
            OpenCVLoader.initAsync(OpenCVLoader.OPENCV_VERSION_3_0_0, this, mLoaderCallback);
        } else {
            Log.d(TAG, "OpenCV library found inside package. Using it!");
            mLoaderCallback.onManagerConnected(LoaderCallbackInterface.SUCCESS);
        }
    }

    public void onDestroy() {
        super.onDestroy();
        if (mOpenCvCameraView != null)
            mOpenCvCameraView.disableView();
    }

    public void onCameraViewStarted(int width, int height)
    {
        mRgba = new Mat(height, width, CvType.CV_8UC4);
        mDetector = new ColorBlobDetector();
        mSpectrum = new Mat();
        mBlobColorRgba = new Scalar(255);
        mBlobColorHsv = new Scalar(255);
        SPECTRUM_SIZE = new Size(200, 64);
        CONTOUR_COLOR = new Scalar(255,0,0,255);
    }

    public void onCameraViewStopped() {
        mRgba.release();
    }



    public boolean onTouch(View v, MotionEvent event)
    {
        // ----------------------------------------------------
        // Detect the touching point
        // ----------------------------------------------------
        int cols = mRgba.cols();
        int rows = mRgba.rows();

        cameraOffsetCalc.setCameraSize( new double[] {mOpenCvCameraView.getWidth(), mOpenCvCameraView.getHeight()});
        cameraOffsetCalc.calcRatio();
        cameraOffsetCalc.calcOffset();

        cameraOffsetCalc.resizeXY(event.getX() , event.getY());

        int x = cameraOffsetCalc.getResizedXY()[0];
        int y = cameraOffsetCalc.getResizedXY()[1];

        if ((x < 0) || (y < 0) || (x > cols) || (y > rows)) return false;


        System.out.println("Touched inside of the eligible area!");


        // ----------------------------------------------------
        // Calculate a region that has been touched
        // ----------------------------------------------------

        Rect touchedRect = new Rect();

        touchedRect.x = (x>4) ? x-4 : 0;
        touchedRect.y = (y>4) ? y-4 : 0;


        touchedRect.width = (x+4 < cols) ? x + 4 - touchedRect.x : cols - touchedRect.x;
        touchedRect.height = (y+4 < rows) ? y + 4 - touchedRect.y : rows - touchedRect.y;

        Mat touchedRegionRgba = mRgba.submat(touchedRect);

        Mat touchedRegionHsv = new Mat();
        Imgproc.cvtColor(touchedRegionRgba, touchedRegionHsv, Imgproc.COLOR_RGB2HSV_FULL);


        // Calculate average color of touched region
        mBlobColorHsv = Core.sumElems(touchedRegionHsv);
        int pointCount = touchedRect.width*touchedRect.height;
        for (int i = 0; i < mBlobColorHsv.val.length; i++)
            mBlobColorHsv.val[i] /= pointCount;

        mBlobColorRgba = converScalarHsv2Rgba(mBlobColorHsv);

        Log.i(TAG, "Touched rgba color: (" + mBlobColorRgba.val[0] + ", " + mBlobColorRgba.val[1] +
                ", " + mBlobColorRgba.val[2] + ", " + mBlobColorRgba.val[3] + ")");


        mDetector.setHsvColor(mBlobColorHsv);

        Imgproc.resize(mDetector.getSpectrum(), mSpectrum, SPECTRUM_SIZE, 0, 0, Imgproc.INTER_LINEAR_EXACT);

        mIsColorSelected = true;

        touchedRegionRgba.release();
        touchedRegionHsv.release();
        return false; // don't need subsequent touch events
    }

    public Mat onCameraFrame(CvCameraViewFrame inputFrame)
    {
        //update frame counter
        frameCounter = (frameCounter == 5 ? 0 : frameCounter + 1);


        mRgba = inputFrame.rgba();
        Core.flip(mRgba, mRgba, 1);


        //Drawing a Circle
        Imgproc.circle(mRgba, new Point(resolution[0]/2,resolution[1]/2), 5, new Scalar(0, 255, 0, 150), 2);
        //Drawing a Circle
        //Imgproc.circle(mRgba, new Point(300,300), 20, new Scalar(0, 255, 0, 150), 4);

        if (mIsColorSelected) {
            mDetector.process(mRgba);
            List<MatOfPoint> contours = mDetector.getContours();

            Log.e(TAG, "Contours count: " + contours.size());


            //Imgproc.drawContours(mRgba, contours, -1, new Scalar(0, 255, 0),-1);


            //mRgba = new Mat( mRgba.rows(), mRgba.cols(), mRgba.type(), new Scalar(0,0,0));

            int count = 0;
            for(int i = 0; i < contours.size(); ++i)
            {

                // draw contours
                Imgproc.drawContours(mRgba, contours, i, new Scalar(255,235,153), -1);

                // call generator for hull points and bounding box
                HullPointsGenerator hullGenerator =  new HullPointsGenerator(contours.get(i));
                boolean eligiblePoints = hullGenerator.generateHullAndBoundingBoxPoints();

                // check if there are eligible points
                if (eligiblePoints)
                {
                    for (int j = 0; j < hullGenerator.getHullPoints().size(); ++j)
                    {
                        Imgproc.line(
                                mRgba,
                                hullGenerator.getHullPoints().get(j),
                                hullGenerator.getHullPoints().get((j + 1) % hullGenerator.getHullPoints().size()),
                                new Scalar(255, 0, 0),
                                5
                        );

                        //Imgproc.circle(mRgba, new Point(hullGenerator.getHullPoints().get(j).x,hullGenerator.getHullPoints().get(j).y), 5, new Scalar(255, 0, 0, 150), 5);

                        //Imgproc.putText(mRgba, j + " ", new Point(hullGenerator.getHullPoints().get(j).x,hullGenerator.getHullPoints().get(j).y -10),  FONT_HERSHEY_SIMPLEX, 1,  new Scalar(255, 0, 0, 150));
                    }


                    for (int j = 0; j < hullGenerator.getRect_points().length; ++j)
                        Imgproc.line(
                                mRgba,
                                hullGenerator.getRect_points()[j],
                                hullGenerator.getRect_points()[(j + 1) % hullGenerator.getRect_points().length],
                                new Scalar(0, 0, 255),
                                3
                        );


                    for (int j = 0; j < hullGenerator.getFoldPts().size(); ++j)
                        Imgproc.circle(mRgba,
                                new Point(hullGenerator.getFoldPts().get(j).x,hullGenerator.getFoldPts().get(j).y), 5, new Scalar(255, 255, 255, 150), 5);

                    for (int j = 0; j < hullGenerator.getTipPts().size(); ++j)
                        Imgproc.circle(mRgba,
                                new Point(hullGenerator.getTipPts().get(j).x,hullGenerator.getTipPts().get(j).y), 5, new Scalar(0, 255, 0, 150), 5);


                }
            }

            //draw circle at center of mass
            CenterOfMass centerOfMass = new CenterOfMass(contours);
            int[] center = centerOfMass.getGravityCenter();

            //Drawing a Circle on the center of mass
            Imgproc.circle(mRgba, new Point(center[0],center[1]), 20, new Scalar(26, 13, 0, 150), 10);

            /*
            Mat colorLabel = mRgba.submat(4, 68, 4, 68);
            colorLabel.setTo(mBlobColorRgba);

            Mat spectrumLabel = mRgba.submat(4, 4 + mSpectrum.rows(), 70, 70 + mSpectrum.cols());
            mSpectrum.copyTo(spectrumLabel);
            */

            System.out.println("ROWS:" + mRgba.rows());
            System.out.println(mRgba.cols());

            System.out.println("MAT:" + Arrays.toString(mRgba.col(0).get(0,0)));



            List<Integer> listB ;
            if (frameCounter == 5) {
                numWrites += 1;

                Log.i(TAG, "FRAME COUNTER = " + frameCounter);
                Log.i(TAG, "Building matrix...");
                int[][] matrix = new int[mRgba.rows()][mRgba.cols()];
                for (int r = 0; r + 3 < mRgba.rows(); r += 3) {
                    for (int c = 0; c + 3 < mRgba.cols(); c += 3)
                    {
                        int p1 = (int) mRgba.get(r, c)[1];
                        int p2 = (int) mRgba.get(r, c+1)[1];
                        int p3 = (int) mRgba.get(r, c+2)[1];

                        matrix[r][c] = (int)  Math.ceil( ((p1 == 255 ? 1 : 0) + (p2 == 255 ? 1 : 0) + (p3 == 255 ? 1 : 0))/3) ;
                    }
                    //Log.e(TAG, Arrays.toString(matrix[r]));
                }
                Log.i(TAG, "End matrix...");

                FileOutputStream outputStream;

                try {
                    outputStream = openFileOutput("RD_Matrix_" + numWrites + ".txt", MODE_APPEND);
                    outputStream.write(matrix.toString().getBytes());
                    outputStream.close();
                    Log.i(TAG, "Matrix on a file...");
                } catch (IOException e) {
                    Log.e("Exception", "File write failed: " + e.toString());
                }
            }

        }
        return mRgba;


    }


    private Scalar converScalarHsv2Rgba(Scalar hsvColor) {
        Mat pointMatRgba = new Mat();
        Mat pointMatHsv = new Mat(1, 1, CvType.CV_8UC3, hsvColor);
        Imgproc.cvtColor(pointMatHsv, pointMatRgba, Imgproc.COLOR_HSV2RGB_FULL, 4);

        return new Scalar(pointMatRgba.get(0, 0));
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String permissions[], int[] grantResults)
    {
        switch (requestCode) {
            case 1: {
                // If request is cancelled, the result arrays are empty.
                if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED) {}
                else
                    {
                    Toast.makeText(MainActivity.this, "Permission denied to read your External storage", Toast.LENGTH_SHORT).show();
                }
                return;
            }
        }
    }
}