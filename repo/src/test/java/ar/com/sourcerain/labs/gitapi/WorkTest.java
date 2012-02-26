/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */

package ar.com.sourcerain.labs.gitapi;

import ar.com.sourcerain.labs.repo.Branch;
import ar.com.sourcerain.labs.repo.Diff;
import ar.com.sourcerain.labs.repo.Repository;
import ar.com.sourcerain.labs.repo.Revision;
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
    
    @BeforeClass
    public void init() {
        commitFile("README");
    }
    
    public File appendFile(String fileName, String value) {
        File f  = new File(repo.home().getPath() + "/" + fileName);
        FileWriter w = null;
        try {
            w = new FileWriter(f);
            w.append(value + "\n");
        } catch (Exception e) {
            throw new RuntimeException("could not append '" + value + "' to " + fileName, e);
        } finally {
            if ( w != null ) {
                try {
                    w.close();
                } catch (IOException ex) {
                    throw new RuntimeException("error closing file " + fileName, ex);
                }
            }
        }
        return f;
    }
    
    @Test(dataProvider="files")
    public void addFile(String name) {
        File file = appendFile(name, "hola");
        
        repo.addFile(file);
        
        assert repo.status().added().contains(name) : "no se agrego el archivo";
    }
    
    @Test(dataProvider="commitFiles")
    public void commitFile(String name) {
        addFile(name);
        
        Random rnd = new Random(System.currentTimeMillis());
        String desc = "random commit " + rnd.nextInt(1000000) + " " + rnd.nextInt(1000000);
        repo.commit( desc );
        
        assert repo.lastLogs(5).next().getDescription().equals(desc);
    }
    
    @Test(dataProvider="branches")
    public void newBranchTest(String name) {
        Branch master = repo.branch();
        Branch branch = newBranch(name);
        repo.checkout(branch);
        commitFile("branch-"+name+"1");
        commitFile("branch-"+name+"2");
        repo.checkout(master);
        commitFile("master-"+name+"1");
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
    public void checkout(String branchName, final String file) {
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

    //checkout un viejo commit, continuar desde ese punto y mergear los nuevos cambios al master
    
    //bisect
    
    //rebase
    @Test(enabled=false)
    public void rebase() {
        commitFile( "file1" );
        commitFile( "file2" );
        commitFile( "file3" );
        Iterator<? extends Revision> logs = repo.lastLogs(5);
        Revision head = logs.next();
        Revision older = null;
        logs.next(); 
        logs.next(); older = logs.next();
        
        repo.checkout( older );
        
//        assert repo.lastLogs(1).next().equals(older) : "bleh";
        
//        repo.reset();
        
        assert repo.lastLogs(1).next().equals(head) : "blah";
    }
    
    @Test(enabled=false)
    public void diff() {
        addFile("diff1");
        appendFile("diff1", "seba");
        Iterator<? extends Diff> diffs = repo.diff(null, null);
        while (diffs.hasNext()) {
            System.out.println("" + diffs.next());
        }
    }
    
    //show
    
    //push, pull, fetch, merge
    
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
