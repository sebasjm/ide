/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */

package ar.com.sourcerain.labs.gitapi;

import ar.com.sourcerain.labs.repo.Repository;
import com.google.inject.Inject;
import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
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
    
    private File file;
    
    @BeforeClass
    public void init() throws IOException {
        file = new File(repo.home().getPath() + "/new_File");
        FileWriter w = new FileWriter(file);
        w.write("hola\n");
        w.close();
    }
    
    public void addFile() {
        repo.addFile(file);
    }
    
    @AfterClass
    public void finish() {
        assert repo.status().added().contains("new_File") : "no se agrego el archivo";
    }
}
