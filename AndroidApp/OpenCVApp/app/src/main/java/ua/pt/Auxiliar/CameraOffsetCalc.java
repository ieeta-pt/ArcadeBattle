package ua.pt.Auxiliar;

public class CameraOffsetCalc
{
    private int[] resolution = null;
    private double[] cameraSize = null;
    private int[] offset = null;
    private int[] resizedXY = null;
    private double ratio = -1 ;



    public CameraOffsetCalc (int[] resolution) { this.resolution = resolution;}



    public double[] getCameraSize() { return cameraSize; }

    public void setCameraSize(double[] cameraSize) { this.cameraSize = cameraSize; }

    public void calcRatio()
    {
        if(resolution == null || cameraSize == null)
            throw new NullPointerException();

        ratio = cameraSize[1]/resolution[1];
    }

    public void calcOffset()
    {
        if(ratio == -1)
            throw new IllegalArgumentException();

        double expectedWidth = ratio * resolution[0];

        offset = new int[] { (int) Math.round((cameraSize[0] - expectedWidth) / 2) , 0};
    }

    public void resizeXY(float x, float y)
    {

        int mX = Math.round(x - offset[0]);
        int mY = Math.round(y - offset[1]);

        if(offset == null)
            throw new IllegalArgumentException();

        resizedXY = new int[] { (int) Math.round(mX/ratio), (int) Math.round(mY/ratio)};
    }

    public int[] getOffset()
    {
        if(offset == null)
            throw new NullPointerException();

        return offset;
    }

    public int[] getResizedXY()
    {
        if(resizedXY == null)
            throw new NullPointerException();

        return resizedXY;
    }





}
