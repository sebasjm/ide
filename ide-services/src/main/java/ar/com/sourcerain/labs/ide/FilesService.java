/**
 *
 */
package ar.com.sourcerain.labs.ide;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;
import javax.inject.Inject;

import org.cometd.bayeux.client.ClientSessionChannel;
import org.cometd.bayeux.server.BayeuxServer;
import org.cometd.bayeux.server.ConfigurableServerChannel;
import org.cometd.bayeux.server.ServerChannel;
import org.cometd.bayeux.server.ServerMessage;
import org.cometd.bayeux.server.ServerSession;
import org.cometd.java.annotation.Configure;
import org.cometd.java.annotation.Listener;
import org.cometd.java.annotation.Service;
import org.cometd.java.annotation.Session;
import org.cometd.server.authorizer.GrantAuthorizer;
import org.cometd.server.filter.DataFilter;
import org.cometd.server.filter.DataFilterMessageListener;
import org.cometd.server.filter.JSONDataFilter;
import org.cometd.server.filter.NoMarkupFilter;

@Service("files")
public class FilesService {

    @Inject
    private BayeuxServer _bayeux;
    @Session
    private ServerSession _session;

    @SuppressWarnings("unused")
    @Configure("/files/**")
    private void configureChatStarStar(ConfigurableServerChannel channel) {
        channel.addAuthorizer(GrantAuthorizer.GRANT_PUBLISH);
    }

    @Listener("/service/files")
    public void files(ServerSession client, ServerMessage message) {
        Map<String, Object> chat = new HashMap<String, Object>();
        chat.put("content", "pablito clavo un clavito");
        
        _session.getLocalSession().getChannel("/files").publish(chat);
    }

}
