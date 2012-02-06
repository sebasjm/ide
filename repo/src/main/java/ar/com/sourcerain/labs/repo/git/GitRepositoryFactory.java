/*
 */
package ar.com.sourcerain.labs.repo.git;

import ar.com.sourcerain.labs.repo.Repository;
import ar.com.sourcerain.labs.repo.RepositoryFactory;
import java.io.File;
import java.io.IOException;
import java.util.logging.Level;
import java.util.logging.Logger;
import org.eclipse.jgit.api.Git;
import org.eclipse.jgit.storage.file.FileRepositoryBuilder;

/**
 *
 * @author Sebastian Javier Marchano sebasjm@sourcerain.com.ar
 */
public class GitRepositoryFactory implements RepositoryFactory {

    
    @Override
    public Repository getRepository(String name) {
        FileRepositoryBuilder builder = new FileRepositoryBuilder();
        File git_repo = new File( name+"/.git" );
        Git git = null;
        try {
            git = new Git( 
                    builder
                        .setGitDir( git_repo )
                        .readEnvironment() 
                        .findGitDir() 
                        .build() 
                );
        } catch (IOException ex) {
            Logger.getLogger(GitRepositoryFactory.class.getName()).log(Level.SEVERE, null, ex);
        }
        return new GitRepository(git);
    }
    
    
    
}
