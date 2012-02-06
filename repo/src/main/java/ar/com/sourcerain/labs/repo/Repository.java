/*
 */
package ar.com.sourcerain.labs.repo;

import java.io.File;
import java.util.List;

/**
 *
 * @author Sebastian Javier Marchano sebasjm@sourcerain.com.ar
 */
public interface Repository {
    
    public File home();
    
    public void addAll();
    public void addFile(File file);
    
    public void commit();
    
    public void stash();
    public Branch branch();
    public List<Branch> branches();
    
    public void checkout(Branch branch);
    
    public void log();
    
    public void push(Repository repo);
    public void pull(Repository repo);
    
    public Status status();

    public void init();
}
