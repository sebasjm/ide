/*
 */
package ar.com.sourcerain.labs.repo.git;

import ar.com.sourcerain.labs.repo.Revision;
import java.io.IOException;
import java.util.Collections;
import java.util.Set;
import java.util.logging.Level;
import java.util.logging.Logger;
import org.eclipse.jgit.diff.DiffFormatter;
import org.eclipse.jgit.lib.Repository;
import org.eclipse.jgit.revwalk.RevCommit;

/**
 *
 * @author Sebastian Javier Marchano sebasjm@sourcerain.com.ar
 */
public class GitRevision implements Revision {

    private RevCommit revCommit;
	private Repository repo;
	
    public GitRevision(RevCommit revCommit, Repository repo) {
        this.revCommit = revCommit;
		this.repo = repo;
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
		DiffFormatter df = new DiffFormatter(null);
		try {
			df.setRepository(repo);
			df.scan(revCommit.getParent(1).getTree(),revCommit.getTree()).iterator().next();
		} catch (IOException ex) {
			Logger.getLogger(GitRevision.class.getName()).log(Level.SEVERE, null, ex);
		}
        return Collections.emptySet();
    }
    
}
