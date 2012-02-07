/*
 */
package ar.com.sourcerain.labs.ide;

import ar.com.sourcerain.labs.repo.Repository;
import ar.com.sourcerain.labs.repo.git.GitRepository;
import ar.com.sourcerain.labs.repo.git.GitRepositoryFactory;
import com.google.inject.Key;
import com.google.inject.name.Names;
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
        repository = new GitRepositoryFactory().getRepository("repo");

        repository.init();
    }

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain) throws IOException, ServletException {
        request.setAttribute("added", Arrays.deepToString( repository.status().added().toArray() ) );
        System.out.println("added " + request.getAttribute("added") );
        chain.doFilter(request, response);
    }

    @Override
    public void destroy() {
        
    }
    
}
