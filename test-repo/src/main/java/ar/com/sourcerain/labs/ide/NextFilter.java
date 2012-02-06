/*
 */
package ar.com.sourcerain.labs.ide;

import java.io.IOException;
import java.util.Random;
import javax.inject.Singleton;
import javax.servlet.*;
import javax.servlet.http.HttpServletResponse;

/**
 *
 * @author Sebastian Javier Marchano sebasjm@sourcerain.com.ar
 */
@Singleton
public class NextFilter implements Filter {

    @Override
    public void init(FilterConfig filterConfig) throws ServletException {
    }

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain) throws IOException, ServletException {
        System.out.println("lslslslslsl");
        int r = new Random( System.currentTimeMillis() ).nextInt(100);
        if (r<50) {
            ((HttpServletResponse)response).sendRedirect("/status.jsp");
        } else {
            ((HttpServletResponse)response).sendRedirect("/index.jsp");
        }
        System.out.println(":DDDDDDDD");
//        chain.doFilter(request, response);
    }

    @Override
    public void destroy() {
    }
    
}
