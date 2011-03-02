/**
 *
 */
package ar.com.sourcerain.labs.ide;

import java.io.File;
import java.util.ArrayList;
import java.util.LinkedList;
import java.util.Map;
import javax.inject.Inject;
import name.fraser.neil.plaintext.diff_match_patch;
import static name.fraser.neil.plaintext.diff_match_patch.Diff;
import static name.fraser.neil.plaintext.diff_match_patch.Operation;

import org.cometd.bayeux.server.BayeuxServer;
import org.cometd.bayeux.server.ConfigurableServerChannel;
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
    private ServerSession _session;

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
    
    @Listener("/service/editor")
    public void editor(ServerSession client, ServerMessage message)  {
        Map<String, Object> params = message.getDataAsMap();

        LinkedList<Diff> diferences = new LinkedList<Diff>();
        Object[] diffs = (Object[]) params.get("diff");
        
        for (Object raw_diff : diffs) {
            Object[] raw_diff_params = (Object[]) raw_diff;
            diferences.add( new Diff(
                    getOperation((Number)raw_diff_params[0]),
                    (String)raw_diff_params[1]
                ) 
            );
        }
        
        System.out.println(" ====== SHOWING DIFERENCES =======");
        System.out.println( dmpEngine.patch_toText( dmpEngine.patch_make(diferences) ) );
        System.out.println("==================================");
    }
}
