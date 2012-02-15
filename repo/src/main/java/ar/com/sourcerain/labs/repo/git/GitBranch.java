/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package ar.com.sourcerain.labs.repo.git;

import ar.com.sourcerain.labs.repo.Branch;
import org.eclipse.jgit.lib.Ref;

/**
 *
 * @author smarchano
 */
public class GitBranch implements Branch {

	private String name;

	public GitBranch(String name) {
		this.name = name;
	}
	
	public GitBranch(Ref ref) {
		this.name = ref.getName().substring(i);
	}
	
	private static final int i = "refs/heads/".length();
	
	@Override
	public String name() {
		return name;
	}
	
}
