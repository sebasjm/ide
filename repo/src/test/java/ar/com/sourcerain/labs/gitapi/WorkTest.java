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
import java.util.Random;
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
    public void init() {
        
    }
    
    public void addFile() throws IOException {
        file = new File(repo.home().getPath() + "/new_File");
        FileWriter w = new FileWriter(file);
        w.write("hola\n");
        w.close();
        
        repo.addFile(file);
        
        assert repo.status().added().contains("new_File") : "no se agrego el archivo";
    }
    
    public void commitFile() throws IOException {
        addFile();
        
        Random rnd = new Random(System.currentTimeMillis());
        String desc = "first commit " + rnd.nextInt(1000000) + " " + rnd.nextInt(1000000);
        repo.commit( desc );
        
        assert repo.lastLogs(5).next().getDescription().equals(desc);
    }
    
    
    @AfterClass
    public void finish() {
        
    }
}
