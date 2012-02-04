/*
 */
package ar.com.sourcerain.labs.repo.git;

import ar.com.sourcerain.labs.repo.Status;
import java.util.Set;

/**
 *
 * @author Sebastian Javier Marchano sebasjm@sourcerain.com.ar
 */
public class GitStatus implements Status {

    private org.eclipse.jgit.api.Status status;

    public GitStatus(org.eclipse.jgit.api.Status status) {
        this.status = status;
    }
    
    @Override
    public Set<String> added() {
        return status.getAdded();
    }
    
}
