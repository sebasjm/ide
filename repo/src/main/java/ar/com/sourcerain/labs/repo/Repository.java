/*
 */
package ar.com.sourcerain.labs.repo;

import java.io.File;
import java.util.Iterator;

/**
 *
 * @author Sebastian Javier Marchano sebasjm@sourcerain.com.ar
 */
public interface Repository {
    
    public File home();
    
    public void addAll();
    public void addFile(File file);
    
    public void commit(String message);
    
    public void stash();
    public Branch branch();
    public Iterator<? extends Branch> branches();
    public Branch newBranch(String name);
    
    public void checkout(Branch branch);
    
    public Iterator<? extends Revision> lastLogs(int n);
    public Iterator<? extends Revision> lastLogsFromFile(int n, String file);
    
    public void push(Repository repo);
    public void pull(Repository repo);
    
    public Status status();

    public void init();
}
