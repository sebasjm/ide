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
	private Class[] from;
	private Object[] args;
    public T asd;

    public MutableIterator(Iterator<K> it, Class<T> to, Class<K>[] from, Object[] args) {
        this.it = it;
        this.to = to;
		this.from = from;
		this.args = new Object[args.length+1];
		System.arraycopy(args, 0, this.args, 1, args.length);
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
			args[0] = it.next();
            return (T) to.getConstructor(from).newInstance(args);
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
