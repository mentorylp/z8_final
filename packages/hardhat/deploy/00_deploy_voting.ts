import { deployScript, artifacts } from "../rocketh/deploy.js";

export default deployScript(
  async env => {
    const { deployer } = env.namedAccounts;
    const voting = await env.deploy("DecentralizedVoting", {
      account: deployer,
      artifact: artifacts.DecentralizedVoting,
    });
    console.log("DecentralizedVoting deployed at", voting.address);
  },
  { tags: ["DecentralizedVoting"] },
);
