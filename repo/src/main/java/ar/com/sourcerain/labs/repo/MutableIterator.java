/*
 */
package ar.com.sourcerain.labs.repo;

import ar.com.sourcerain.labs.repo.git.GitRepository;
import java.lang.reflect.InvocationTargetException;
import java.util.Iterator;
import java.util.logging.Level;
import java.util.logging.Logger;

/**
 *
 * @author Sebastian Javier Marchano sebasjm@sourcerain.com.ar
 */
public class MutableIterator<T,K> implements Iterator<T> {

    private Iterator<K> it;
    private Class to;
    private Class from;
    public T asd;

    public MutableIterator(Iterator<K> it, Class<K> from, Class<T> to) {
        this.it = it;
        this.to = to;
        this.from = from;
        assert to != null : "could not infere parameter";
    }

    @Override
    public boolean hasNext() {
        return it.hasNext();
    }

    @Override
    public T next() {
        Exception e;
        try {
            return (T) to.getConstructor(from).newInstance(it.next());
        } catch (NoSuchMethodException ex) {
            e = ex;
            Logger.getLogger(GitRepository.class.getName()).log(Level.SEVERE, null, ex);
        } catch (SecurityException ex) {
            e = ex;
            Logger.getLogger(GitRepository.class.getName()).log(Level.SEVERE, null, ex);
        } catch (InstantiationException ex) {
            e = ex;
            Logger.getLogger(GitRepository.class.getName()).log(Level.SEVERE, null, ex);
        } catch (IllegalAccessException ex) {
            e = ex;
            Logger.getLogger(GitRepository.class.getName()).log(Level.SEVERE, null, ex);
        } catch (IllegalArgumentException ex) {
            e = ex;
            Logger.getLogger(GitRepository.class.getName()).log(Level.SEVERE, null, ex);
        } catch (InvocationTargetException ex) {
            e = ex;
            Logger.getLogger(GitRepository.class.getName()).log(Level.SEVERE, null, ex);
        }
        throw new RuntimeException("couldnt create a revision instance", e);
    }

    @Override
    public void remove() {
        throw new UnsupportedOperationException("Not supported yet.");
    }
}
