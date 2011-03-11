/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */

package ar.com.sourcerain.labs.gitapi;

import com.google.inject.Binder;
import com.google.inject.Module;
import java.io.File;
import java.io.IOException;
import java.net.URL;
import java.util.Properties;
import java.util.ResourceBundle;
import java.util.logging.Level;
import java.util.logging.Logger;
import org.eclipse.jgit.lib.Repository;
import org.eclipse.jgit.storage.file.FileRepositoryBuilder;

/**
 *
 * @author javier.marchano
 */
public class RepoConfigModule implements Module {

    public static final String repo_dir = ResourceBundle.getBundle("config").getString("repository.dir");
    public static final File git_repo = new File( repo_dir+"/.git" );
    
    @Override
    public void configure(Binder binder) {
        try {
            FileRepositoryBuilder builder = new FileRepositoryBuilder();
            Repository repository = builder.setGitDir( git_repo ).readEnvironment() 
                    .findGitDir() 
                    .build();
            
            binder.bind(Repository.class).toInstance(repository);
        } catch (IOException ex) {
            throw new RuntimeException(ex);
        }
    }

}
