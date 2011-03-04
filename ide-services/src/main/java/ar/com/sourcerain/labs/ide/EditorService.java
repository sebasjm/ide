/**
 *
 */
package ar.com.sourcerain.labs.ide;

import java.io.IOException;
import java.util.logging.Level;
import java.util.logging.Logger;
import java.io.File;
import java.io.FileOutputStream;
import java.nio.ByteBuffer;
import java.nio.channels.FileChannel;
import java.nio.channels.FileLock;
import java.util.LinkedList;
import java.util.Map;
import javax.inject.Inject;
import name.fraser.neil.plaintext.diff_match_patch;
import static name.fraser.neil.plaintext.diff_match_patch.Diff;
import static name.fraser.neil.plaintext.diff_match_patch.Patch;
import static name.fraser.neil.plaintext.diff_match_patch.Operation;
import org.apache.commons.io.FileUtils;

import org.cometd.bayeux.server.BayeuxServer;
import org.cometd.bayeux.server.ConfigurableServerChannel;
import org.cometd.bayeux.server.LocalSession;
import org.cometd.bayeux.server.ServerMessage;
import org.cometd.bayeux.server.ServerSession;
import org.cometd.java.annotation.Configure;
import org.cometd.java.annotation.Listener;
import org.cometd.java.annotation.Service;
import org.cometd.java.annotation.Session;
import org.cometd.server.authorizer.GrantAuthorizer;

@Service("editor")
public class EditorService {

    private static final diff_match_patch dmpEngine = new diff_match_patch();
    
    @Inject
    private BayeuxServer _bayeux;
    @Session
    private ServerSession _server;
    @Session
    private LocalSession _local;


    @SuppressWarnings("unused")
    @Configure("/editor/**")
    private void configureEditorStarStar(ConfigurableServerChannel channel) {
        channel.addAuthorizer(GrantAuthorizer.GRANT_PUBLISH);
    }

    public Operation getOperation(Number val) {
        switch (val.intValue()) {
            case -1: return Operation.DELETE;
            case 0: return Operation.EQUAL;
            case 1: return Operation.INSERT;
        }
        throw new RuntimeException("Unkown operation: " + val);
    }
    
    public LinkedList<Patch> getPatchesFromRaw(Object[] raw_patches){
        LinkedList<Patch> result = new LinkedList<Patch>();
        for (Object raw_patchs : raw_patches) {
            Map raw_patch_params = (Map) raw_patchs;
            Patch patch = new Patch();
            patch.start1 = ((Number)raw_patch_params.get("start1")).intValue();
            patch.length1 = ((Number)raw_patch_params.get("length1")).intValue();
            patch.start2 = ((Number)raw_patch_params.get("start2")).intValue();
            patch.length2 = ((Number)raw_patch_params.get("length2")).intValue();
            patch.diffs = new LinkedList<Diff>();
            for (Object raw_diffs : (Object[])raw_patch_params.get("diffs")) {
                Object[] raw_diff_params = (Object[]) raw_diffs;
                patch.diffs.add(new Diff(
                        getOperation((Number) raw_diff_params[0]),
                        (String) raw_diff_params[1]
                    )
                );
            }
            result.add(patch);
        }
        return result;
    }
    
    @Listener("/service/editor")
    public void editor(ServerSession client, ServerMessage message)  {
        Map<String, Object> params = message.getDataAsMap();

        LinkedList<Patch> patches = getPatchesFromRaw( (Object[]) params.get("patch") );
        
        System.out.println(" ====== SHOWING DIFERENCES =======");
        System.out.println( dmpEngine.patch_toText( patches ) );
        System.out.println("==================================");
        
        File fileIn = (File)_server.getAttribute("editingFile");
        fileIn = FilesService.openedFile;
        
        File fileOut = new File(fileIn.getParentFile().getAbsolutePath() + "/._tmp_" + fileIn.getName() );
        
        try {
            FileChannel ifc = FileUtils.openInputStream(fileIn).getChannel();
            FileChannel ofc = new FileOutputStream(fileOut, true).getChannel();
            
//            FileLock ifl = ifc.lock();
//            FileLock ofl = ofc.lock();
            
            for (Patch patch : patches){
                
                long offset = 0;
                ofc.transferFrom( ifc, ofc.position(), patch.start1 - offset);
                offset += patch.start1;
                for (Diff diff : patch.diffs) {
                    switch (diff.operation) {
                        case DELETE:
                            ifc.position( ifc.position() + diff.text.length() );
                            break;
                        case INSERT:
                            ofc.write( ByteBuffer.wrap( diff.text.getBytes() ) );
                            break;
                        case EQUAL:
                            ifc.position( ifc.position() + diff.text.length() );
                            ofc.write( ByteBuffer.wrap( diff.text.getBytes() ) );
                            break;
                    }
                    offset += diff.text.length();
                }
            }
            
            ofc.transferFrom(ifc, ofc.position(), Integer.MAX_VALUE);
            
//            ifl.release();
//            ofl.release();
            
            ifc.close();
            ofc.close();
            
            fileIn.delete();
            fileOut.renameTo(fileIn);
            
        } catch (IOException ex) {
            Logger.getLogger(EditorService.class.getName()).log(Level.SEVERE, null, ex);
        }
    }
}
