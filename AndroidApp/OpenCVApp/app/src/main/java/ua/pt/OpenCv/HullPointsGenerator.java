package ua.pt.OpenCv;

import org.opencv.core.CvType;
import org.opencv.core.MatOfInt;
import org.opencv.core.MatOfInt4;
import org.opencv.core.MatOfPoint;
import org.opencv.core.MatOfPoint2f;
import org.opencv.core.Point;
import org.opencv.core.RotatedRect;
import org.opencv.imgproc.Imgproc;
import org.opencv.imgproc.Moments;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;


public class HullPointsGenerator
{
    private MatOfPoint mContour;

    private ArrayList<Point> hullPoints = new ArrayList<Point>();
    private MatOfPoint hull_points = new MatOfPoint();

    private Point rect_points[] = new Point[4];
    private ArrayList<Point[]> defect_points =  new ArrayList<>();

    private MatOfInt hull;
    private MatOfInt4 defects;

    private double hullArea;
    private  double boxArea;

    private boolean existEligibleHulls;


    MatOfInt convexHullMatOfInt = new MatOfInt();
    ArrayList<Point> convexHullPointArrayList = new ArrayList<Point>();
    MatOfPoint convexHullMatOfPoint = new MatOfPoint();
    ArrayList<MatOfPoint> convexHullMatOfPointArrayList = new ArrayList<MatOfPoint>();

    ArrayList<Point> tipPts = new ArrayList<Point>();
    ArrayList<Point> foldPts = new ArrayList<Point>();
    ArrayList<Integer> depths = new ArrayList<Integer>();



    ArrayList<Point> ends = new ArrayList<Point>();



    private static final int MIN_FINGER_DEPTH = 20;
    private static final int MAX_FINGER_ANGLE = 60;   // degrees

    public HullPointsGenerator (MatOfPoint mContour) { this.mContour = mContour; }


    private void calcHullPoints()
    {
        // find bounding convex hull, approxPolyDP get simplifiy convex hull
        hull = new MatOfInt();
        Imgproc.convexHull(mContour, hull, false);

        for(int j=0; j < hull.toList().size(); j++)
            hullPoints.add(mContour.toList().get(hull.toList().get(j)));

        hull_points.fromList(hullPoints);

        // calc area
        hullArea  = Imgproc.contourArea(hull_points);
    }


    private void calcBoundingBox()
    {
        // find each rotated bounding box
        MatOfPoint2f points = new MatOfPoint2f();

        mContour.convertTo(points, CvType.CV_32F);

        RotatedRect box = Imgproc.minAreaRect(points);
        box.points(rect_points);

        MatOfPoint temp_rect_points = new MatOfPoint();
        temp_rect_points.fromArray(rect_points);

        boxArea = Imgproc.contourArea(temp_rect_points);
    }

    private void calcDefects()
    {

        defects = new MatOfInt4();

        Imgproc.convexityDefects(mContour, hull, defects);


        int max_points = 0;
        long numPoints = defects.total();

        System.out.println("Num Points: " + numPoints);
        if (numPoints > max_points) {
            System.out.println("Processing " + max_points + " defect pts");
            numPoints = max_points;
        }

        Point[] tipPts =  new Point[(int) numPoints];
        Point[] endPts =  new Point[(int) numPoints];
        Point[] foldPts =  new Point[(int) numPoints];
        double[] depths = new double[(int) numPoints];

        for (int i = 0; i < numPoints; i++) {
            double[] dat = defects.get(i, 0);

            double[] startdat = mContour.get((int) dat[0], 0);

            Point startPt = new Point(startdat[0], startdat[1]);

            tipPts[i] = startPt;

            double[] enddat = mContour.get((int) dat[1], 0);
            endPts[i] = new Point(enddat[0], enddat[1]);

            double[] depthdat = mContour.get((int) dat[2], 0);
            Point depthPt = new Point(depthdat[0], depthdat[1]);
            foldPts[i] = depthPt;

            depths[i] = dat[3];
        }

        defect_points.add(tipPts);
        defect_points.add(foldPts);
        defect_points.add(tipPts);
    }


    private boolean eligibleHulls()
    {
        int count = 0;

        if (hullArea>10 && (hullArea>(boxArea*0.5))) {
            ++count;

            // simplify hull
            double epsilon = 1;
            MatOfPoint2f tempPoints = new MatOfPoint2f();
            hull_points.convertTo(tempPoints, CvType.CV_32F);

            while (tempPoints.toArray().length > 2) {
                Imgproc.approxPolyDP(tempPoints, tempPoints, epsilon, true);
                epsilon *= 2;
                //System.out.println("simplified hull  "+tempPoints.toArray().length+" "+epsilon);
            }
            hull_points.fromArray(tempPoints.toArray());

            /*
            System.out.println("simplified hull0 "+tempPoints.toArray().length+" "+epsilon);
            System.out.println("contour:area: "+hullArea + "  " + boxArea);
            System.out.println("contour:hull:"+count+": "+hull_points.toArray().length);
            */

            return true;
        }
        return false;
    }

    public void xpto()
    {
        MatOfInt4 mConvexityDefectsMatOfInt4 = new MatOfInt4();
        int[] mConvexityDefectsIntArray = null;

        Imgproc.convexityDefects(mContour, hull, mConvexityDefectsMatOfInt4);

        if(!mConvexityDefectsMatOfInt4.empty())
        {
            mConvexityDefectsIntArray = new int[mConvexityDefectsMatOfInt4.toArray().length];
            mConvexityDefectsIntArray = mConvexityDefectsMatOfInt4.toArray();


            for (int i = 0; i < mConvexityDefectsIntArray.length/4; i++)
            {
                tipPts.add(mContour.toList().get(mConvexityDefectsIntArray[4*i]));
                //tipPts.add(mContour.toList().get(mConvexityDefectsIntArray[4*i+1]));
                foldPts.add(mContour.toList().get(mConvexityDefectsIntArray[4*i+2]));
                depths.add(mConvexityDefectsIntArray[4*i+3]);
            }
        }
    }


    public boolean generateHullAndBoundingBoxPoints()
    {
        calcHullPoints();
        calcBoundingBox();
        calcDefects();
        xpto();
        existEligibleHulls =  eligibleHulls();
        return existEligibleHulls;
    }


    public ArrayList<Point> getHullPoints() { return existEligibleHulls ? hullPoints: null; }

    public Point[] getRect_points() { return existEligibleHulls ? rect_points : null ; }

    public ArrayList<Point[]> getDefect_points() { return defect_points;}

    public ArrayList<Point> getFoldPts() {return foldPts;}

    public ArrayList<Point> getTipPts() {return tipPts;}



}


