/*
 */
package ar.com.sourcerain.labs.repo.git;

import ar.com.sourcerain.labs.repo.*;
import java.io.File;
import java.io.IOException;
import java.util.Iterator;
import java.util.logging.Level;
import java.util.logging.Logger;
import org.apache.commons.io.FileUtils;
import org.eclipse.jgit.api.Git;
import org.eclipse.jgit.api.errors.*;
import org.eclipse.jgit.errors.NoWorkTreeException;
import org.eclipse.jgit.errors.UnmergedPathException;
import org.eclipse.jgit.lib.Ref;
import org.eclipse.jgit.revwalk.RevCommit;
/**
 *
 * @author Sebastian Javier Marchano sebasjm@sourcerain.com.ar
 */
public class GitRepository implements Repository {

    private Git git;
    
    public GitRepository(Git git) {
        this.git = git;
    }

    @Override
    public void addAll() {
        throw new UnsupportedOperationException("Not supported yet.");
    }

    @Override
    public void addFile(File file) {
        try {
            git.add().addFilepattern( file.getName() ).call();
//            dirty_status = true;
        } catch (NoFilepatternException ex) {
            Logger.getLogger(GitRepository.class.getName()).log(Level.SEVERE, null, ex);
        }
    }

    @Override
    public void commit(String message) {
        try {
            git.commit().setMessage(message).call();
        } catch (NoHeadException ex) {
            Logger.getLogger(GitRepository.class.getName()).log(Level.SEVERE, null, ex);
        } catch (NoMessageException ex) {
            Logger.getLogger(GitRepository.class.getName()).log(Level.SEVERE, null, ex);
        } catch (UnmergedPathException ex) {
            Logger.getLogger(GitRepository.class.getName()).log(Level.SEVERE, null, ex);
        } catch (ConcurrentRefUpdateException ex) {
            Logger.getLogger(GitRepository.class.getName()).log(Level.SEVERE, null, ex);
        } catch (JGitInternalException ex) {
            Logger.getLogger(GitRepository.class.getName()).log(Level.SEVERE, null, ex);
        } catch (WrongRepositoryStateException ex) {
            Logger.getLogger(GitRepository.class.getName()).log(Level.SEVERE, null, ex);
        }
    }

    @Override
    public void stash() {
        throw new UnsupportedOperationException("Not supported yet.");
    }

    @Override
    public Branch branch() {
        throw new UnsupportedOperationException("Not supported yet.");
    }

    @Override
    public List<Branch> branches() {
        throw new UnsupportedOperationException("Not supported yet.");
    }

    @Override
    public Branch newBranch(String name) {
        throw new UnsupportedOperationException("Not supported yet.");
    }

    @Override
    public void checkout(Branch branch) {
        throw new UnsupportedOperationException("Not supported yet.");
    }

    @Override
    public void push(Repository repo) {
        throw new UnsupportedOperationException("Not supported yet.");
    }

    @Override
    public void pull(Repository repo) {
        throw new UnsupportedOperationException("Not supported yet.");
    }

    private boolean dirty_status = true;
    private Status status;
    @Override
    public Status status() {
//        if (dirty_status){
            try {
                status = new GitStatus(git.status().call());
//                dirty_status = false;
            } catch (IOException ex) {
                Logger.getLogger(GitRepository.class.getName()).log(Level.SEVERE, null, ex);
            } catch (NoWorkTreeException ex) {
                Logger.getLogger(GitRepository.class.getName()).log(Level.SEVERE, null, ex);
            }
//        }
        return status;
    }

    @Override
    public void init() {
        try {
            FileUtils.deleteDirectory( home() );
            git.getRepository().create(false);
        } catch (IOException ex) {
            Logger.getLogger(GitRepository.class.getName()).log(Level.SEVERE, null, ex);
        }
    }

    @Override
    public File home() {
        return git.getRepository().getDirectory().getParentFile();
    }

    @Override
    public Iterator<? extends Revision> lastLogs(int n) {
        Exception e;
        try {
            return new MutableIterator( git.log().call().iterator(), RevCommit.class, GitRevision.class );
        } catch (NoHeadException ex) {
            e = ex; Logger.getLogger(GitRepository.class.getName()).log(Level.SEVERE, null, ex);
        } catch (JGitInternalException ex) {
            e = ex; Logger.getLogger(GitRepository.class.getName()).log(Level.SEVERE, null, ex);
        }
        throw new RuntimeException("git exception",e);
    }

    @Override
    public Iterator<? extends Revision> lastLogsFromFile(int n, String file) {
        Exception e;
        try {
            return new MutableIterator( git.log().addPath(file).call().iterator(), RevCommit.class, GitRevision.class );
        } catch (NoHeadException ex) {
            e = ex; Logger.getLogger(GitRepository.class.getName()).log(Level.SEVERE, null, ex);
        } catch (JGitInternalException ex) {
            e = ex; Logger.getLogger(GitRepository.class.getName()).log(Level.SEVERE, null, ex);
        }
        throw new RuntimeException("git exception",e);
    }

}
