package ua.pt.OpenCv;

import org.opencv.core.MatOfPoint;
import org.opencv.imgproc.Imgproc;
import org.opencv.imgproc.Moments;

import java.util.ArrayList;
import java.util.List;

public class CenterOfMass
{
    private List<MatOfPoint> contours;
    private int x_coord = 0;
    private int y_coord = 0;

    public CenterOfMass(List<MatOfPoint> contours){this.contours = contours;}

    public int[] getGravityCenter()
    {
        List<Moments> mu = new ArrayList<Moments>(contours.size());
        for (int i = 0; i < contours.size(); i++) {
            mu.add(i, Imgproc.moments(contours.get(i), false));
            Moments p = mu.get(i);
            x_coord = (int) (p.get_m10() / p.get_m00());
            y_coord = (int) (p.get_m01() / p.get_m00());
        }
        return  new int[] {x_coord,y_coord};
    }


}

