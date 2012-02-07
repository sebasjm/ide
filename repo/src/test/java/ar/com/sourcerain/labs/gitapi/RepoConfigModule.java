/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */

package ar.com.sourcerain.labs.gitapi;

import ar.com.sourcerain.labs.repo.Repository;
import ar.com.sourcerain.labs.repo.git.GitRepositoryFactory;
import com.google.inject.Binder;
import com.google.inject.Module;
import java.util.ResourceBundle;

/**
 *
 * @author javier.marchano
 */
public class RepoConfigModule implements Module {

    public static final String repo_dir = ResourceBundle.getBundle("config").getString("repository.dir");
    
    @Override
    public void configure(Binder binder) {
        Repository repository = new GitRepositoryFactory().getRepository(repo_dir);

        repository.init();
        
        binder.bind(Repository.class).toInstance(repository);
    }

}
