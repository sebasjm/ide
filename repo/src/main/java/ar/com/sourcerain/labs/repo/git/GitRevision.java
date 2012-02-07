/*
 */
package ar.com.sourcerain.labs.repo.git;

import ar.com.sourcerain.labs.repo.Revision;
import java.util.Collections;
import java.util.Set;
import org.eclipse.jgit.revwalk.RevCommit;

/**
 *
 * @author Sebastian Javier Marchano sebasjm@sourcerain.com.ar
 */
public class GitRevision implements Revision {

    private RevCommit revCommit;

    public GitRevision(RevCommit revCommit) {
        this.revCommit = revCommit;
    }
    
    @Override
    public String getId() {
        return revCommit.getName();
    }

    @Override
    public String getAuthor() {
        return revCommit.getAuthorIdent().toString();
    }

    @Override
    public String getDescription() {
        return revCommit.getShortMessage();
    }

    @Override
    public Set<String> getFiles() {
        return Collections.emptySet();
    }
    
}
