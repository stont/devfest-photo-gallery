# To learn more about how to use Nix to configure your environment
# see: https://developers.google.com/idx/guides/customize-idx-env
{ pkgs, ... }: {
  # Which nixpkgs channel to use.
  channel = "stable-24.05"; # or "unstable"

  # Use https://search.nixos.org/packages to find packages
  packages = [
    pkgs.nodejs_20  # For running the web application
    pkgs.firebase-tools # For Firebase CLI interaction
    pkgs.git # For version control
  ];

  # Sets environment variables in the workspace
  env = {};

  idx = {
    # Search for the extensions you want on https://open-vsx.org/ and use "publisher.id"
    extensions = [
      "dbaeumer.vscode-eslint" # For JavaScript linting
      "esbenp.prettier-vscode" # For code formatting
      "aaron-bond.better-comments" # For better comments
      "ms-azuretools.vscode-docker" # Docker extension
    ];

    # Enable previews
    previews = {
      enable = true;
      previews = {
        web = {
          # Command to run the development server
          command = ["npm" "run" "dev" "--" "--port" "$PORT" "--host" "0.0.0.0"];
          manager = "web";
        };
      };
    };

    # Workspace lifecycle hooks
    workspace = {
      # Runs when a workspace is first created
      onCreate = {
        npm-install = "npm install";
        # Open editors for the following files by default, if they exist:
        default.openFiles = [
          ".idx/dev.nix"
          "README.md"
          "package.json"
          "src/main.js"
        ];
      };
      # Runs when the workspace is (re)started
      onStart = {
        # start-dev-server = "npm run dev";
      };
    };
  };
}
