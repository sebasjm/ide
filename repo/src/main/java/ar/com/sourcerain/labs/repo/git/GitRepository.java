/*
 */
package ar.com.sourcerain.labs.repo.git;

import ar.com.sourcerain.labs.repo.Branch;
import ar.com.sourcerain.labs.repo.Repository;
import ar.com.sourcerain.labs.repo.Status;
import java.io.File;
import java.io.IOException;
import java.util.List;
import java.util.logging.Level;
import java.util.logging.Logger;
import org.apache.commons.io.FileUtils;
import org.eclipse.jgit.api.Git;
import org.eclipse.jgit.api.errors.NoFilepatternException;
import org.eclipse.jgit.errors.NoWorkTreeException;
/**
 *
 * @author Sebastian Javier Marchano sebasjm@sourcerain.com.ar
 */
public class GitRepository implements Repository{

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
        } catch (NoFilepatternException ex) {
            Logger.getLogger(GitRepository.class.getName()).log(Level.SEVERE, null, ex);
        }
    }

    @Override
    public void commit() {
        throw new UnsupportedOperationException("Not supported yet.");
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
    public void checkout(Branch branch) {
        throw new UnsupportedOperationException("Not supported yet.");
    }

    @Override
    public void log() {
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

    private boolean dirty = true;
    private Status status;
    @Override
    public Status status() {
        if (dirty){
            try {
                status = new GitStatus(git.status().call());
                dirty = false;
            } catch (IOException ex) {
                Logger.getLogger(GitRepository.class.getName()).log(Level.SEVERE, null, ex);
            } catch (NoWorkTreeException ex) {
                Logger.getLogger(GitRepository.class.getName()).log(Level.SEVERE, null, ex);
            }
        }
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
    
}
