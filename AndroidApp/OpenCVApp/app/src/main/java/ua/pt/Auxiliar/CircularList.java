package ua.pt.Auxiliar;

import java.util.ArrayList;
import java.util.List;

public class CircularList
{
    private int size;
    private int index = 0;
    private List<Object> mList;

    public CircularList(int size)
    {
        this.size = size;
        mList =  new ArrayList<>();

        for(int i = 0 ; i<size; i++)
            mList.add(null);
    }

    public void add(Object o)
    {
        if (index == size) index=0;
        mList.set(index++, o);
    }

    public List<Object> getList() { return  mList;}
}
