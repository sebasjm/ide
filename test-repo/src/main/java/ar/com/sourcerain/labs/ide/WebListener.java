/*
 */
package ar.com.sourcerain.labs.ide;

import ar.com.sourcerain.labs.repo.Repository;
import ar.com.sourcerain.labs.repo.git.GitRepositoryFactory;
import com.google.inject.Binder;
import com.google.inject.Guice;
import com.google.inject.Injector;
import com.google.inject.Module;
import com.google.inject.servlet.GuiceServletContextListener;
import com.google.inject.servlet.ServletModule;

/**
 *
 * @author Sebastian Javier Marchano sebasjm@sourcerain.com.ar
 */
public class WebListener extends GuiceServletContextListener{

    @Override
    protected Injector getInjector() {
        return Guice.createInjector(new ServletModule() {

            @Override
            protected void configureServlets() {
                filter("/status.jsp").through(StatusFilter.class);
                filter("/next").through(NextFilter.class);
            }
            
        }, new Module() {

            @Override
            public void configure(Binder binder) {
                binder
                    .bind(Repository.class)
                    .toInstance(new GitRepositoryFactory().getRepository("repository") );
            }
        });
    }
    
}
