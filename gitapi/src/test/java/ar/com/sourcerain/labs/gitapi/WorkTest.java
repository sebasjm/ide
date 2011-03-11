/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */

package ar.com.sourcerain.labs.gitapi;

import com.google.inject.Inject;
import java.io.IOException;
import org.apache.commons.io.FileUtils;
import org.eclipse.jgit.api.Git;
import org.eclipse.jgit.api.errors.NoFilepatternException;
import org.eclipse.jgit.lib.Repository;
import org.testng.annotations.AfterClass;
import org.testng.annotations.BeforeClass;
import org.testng.annotations.Guice;
import org.testng.annotations.Test;

/**
 *
 * @author javier.marchano
 */
@Test
@Guice(modules=RepoConfigModule.class)
public class WorkTest {

    @Inject
    private Repository repo;
    
    @BeforeClass
    public void init() throws IOException {
        FileUtils.deleteDirectory( repo.getDirectory().getParentFile() );
        repo.create(false);
    }
    
    public void addFile() throws NoFilepatternException {
        Git git = new Git(repo);
        git.add().addFilepattern(".").call();
    }
    
    @AfterClass
    public void finish() throws IOException {
        
    }
}
