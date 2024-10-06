{
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs =
    {
      self,
      flake-utils,
      nixpkgs,
    }:
    flake-utils.lib.eachDefaultSystem (
      system:
      let
        pkgs = (import nixpkgs) {
          inherit system;
        };
      in
      with pkgs;
      {
        devShell = mkShell {
          packages = [
            prefetch-npm-deps
          ];
        };
        packages.default = callPackage ./nix/package.nix { };
      }
    );
}
