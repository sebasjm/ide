/*
 */
package ar.com.sourcerain.labs.repo.git;

import ar.com.sourcerain.labs.repo.Diff;
import org.eclipse.jgit.diff.DiffEntry;

/**
 *
 * @author Sebastian Javier Marchano sebasjm@sourcerain.com.ar
 */
public class GitDiff implements Diff {
    
    private DiffEntry diff;

    public GitDiff(DiffEntry diff) {
        this.diff = diff;
    }

    @Override
    public String toString() {
        return diff.toString();
    }
    
}
