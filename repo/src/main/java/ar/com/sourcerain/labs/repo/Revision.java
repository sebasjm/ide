/*
 */
package ar.com.sourcerain.labs.repo;

import java.util.Set;

/**
 *
 * @author Sebastian Javier Marchano sebasjm@sourcerain.com.ar
 */
public interface Revision {

    String getId();
    String getAuthor();
    String getDescription();
    Set<String> getFiles();
    //getdiff()
    
}
