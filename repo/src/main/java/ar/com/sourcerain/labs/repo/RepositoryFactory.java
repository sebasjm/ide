package ar.com.sourcerain.labs.repo;

/**
 *
 * @author sebasjm
 */
public interface RepositoryFactory {
    
    public Repository getRepository(String name);
    
}
