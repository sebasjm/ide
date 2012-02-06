/*
 */
package ar.com.sourcerain.labs.ide;

import ar.com.sourcerain.labs.repo.Repository;
import java.io.IOException;
import java.util.Arrays;
import javax.inject.Inject;
import javax.inject.Singleton;
import javax.servlet.*;

/**
 *
 * @author Sebastian Javier Marchano sebasjm@sourcerain.com.ar
 */
@Singleton
public class StatusFilter implements Filter {

    @Inject
    private Repository repository;
    
    @Override
    public void init(FilterConfig filterConfig) throws ServletException {
        repository.init();
    }

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain) throws IOException, ServletException {
        request.setAttribute("added", Arrays.deepToString( repository.status().added().toArray() ) );
        chain.doFilter(request, response);
    }

    @Override
    public void destroy() {
        
    }
    
}
