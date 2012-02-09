/*
 */
package ar.com.sourcerain.labs.repo;

import ar.com.sourcerain.labs.repo.git.GitRepository;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.ParameterizedType;
import java.util.Iterator;
import java.util.logging.Level;
import java.util.logging.Logger;
import org.eclipse.jgit.revwalk.RevCommit;

/**
 *
 * @author Sebastian Javier Marchano sebasjm@sourcerain.com.ar
 */
public class MutableIterator<T> implements Iterator<T> {

    private Iterator<RevCommit> revs;
    private Class T;
    public T asd;

    public MutableIterator(Iterator<RevCommit> revs, Class<T> clazz) {
        this.revs = revs;
        this.T = clazz;
        assert T != null : "could not infere parameter";
    }

    @Override
    public boolean hasNext() {
        return revs.hasNext();
    }

    @Override
    public T next() {
        Exception e;
        try {
            return (T) T.getConstructor(RevCommit.class).newInstance(revs.next());
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
