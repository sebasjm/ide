/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */

package ar.com.sourcerain.labs.gitapi;

import ar.com.sourcerain.labs.repo.Branch;
import ar.com.sourcerain.labs.repo.Repository;
import com.google.inject.Inject;
import java.io.File;
import java.io.FileWriter;
import java.io.FilenameFilter;
import java.io.IOException;
import java.util.Iterator;
import java.util.Random;
import org.testng.annotations.*;

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
        commitFile("README");
    }
    
    @Test(dataProvider="files")
    public void addFile(String name) throws IOException {
        file = new File(repo.home().getPath() + "/" + name);
        FileWriter w = new FileWriter(file);
        w.write("hola\n");
        w.close();
        
        repo.addFile(file);
        
        assert repo.status().added().contains(name) : "no se agrego el archivo";
    }
    
    @Test(dataProvider="commitFiles")
    public void commitFile(String name) throws IOException {
        addFile(name);
        
        Random rnd = new Random(System.currentTimeMillis());
        String desc = "first commit " + rnd.nextInt(1000000) + " " + rnd.nextInt(1000000);
        repo.commit( desc );
        
        assert repo.lastLogs(5).next().getDescription().equals(desc);
    }
    
    @Test(dataProvider="branches")
    public void newBranchTest(String name) {
        newBranch(name);
    }
    
    public Branch newBranch(String name) {
//        assert repo.branch().name().equals("master") : "initial branch is not master";
        
        Branch newBranch = repo.newBranch(name);

        Iterator<? extends Branch> branches = repo.branches();
        Branch found = null;
        while (branches.hasNext() && !name.equals( (found = branches.next()).name() ));
		
        assert found.name().equals(name) : "coulnt find branch " + name ;
        
        return newBranch;
    }
    
    @Test(dataProvider="checkout_test")
    public void checkout(String branchName, final String file) throws IOException {
        FilenameFilter filter = new FilenameFilter() {
            @Override
            public boolean accept(File dir, String name) {
                return file.equals(name);
            }
        };
        
        Branch master = repo.branch();
        Branch branch = newBranch( branchName );
        
        commitFile( file );
        
        repo.checkout( branch );
        
        assert repo.branch().name().equals(branchName) : "we should be in " + branchName + " branch and we are in " + repo.branch().name();
        assert repo.home().list( filter ).length == 0 : "file shouldnt be in this branch";
        
        repo.checkout( master );
        
        assert repo.branch().name().equals("master") : "we should be in master branch and we are in " + repo.branch().name();
        assert repo.home().list( filter ).length == 1 : "file should be in this branch";
    }
    
    @AfterClass
    public void finish() {
        
    }
    
    //Data providers
    
    @DataProvider
    public Object[][] files() {
        return new Object[][] {
            {"newFile"}
        };
    }
    
    @DataProvider
    public Object[][] commitFiles() {
        return new Object[][] {
            {"newFileCommit"}
        };
    }
    
    @DataProvider
    public Object[][] branches() {
        return new Object[][] {
            {"pepe"}
        };
    }
    
    @DataProvider
    public Object[][] checkout_test() {
        return new Object[][] {
            {"check", "lala_file"}
        };
    }
}
