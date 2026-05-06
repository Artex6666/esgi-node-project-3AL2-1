{
  description = "ESGI Cinema API — dev environment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
      in {
        devShells.default = pkgs.mkShell {
          packages = with pkgs; [
            nodejs_25
            openssl
          ];

          # Prisma's bundled debian engines ship with @prisma/engines and are
          # version-matched to @prisma/client. Pointing at them sidesteps Prisma's
          # failed `linux-nixos` auto-detection without coupling to nixpkgs' own
          # prisma-engines version.
          PRISMA_QUERY_ENGINE_LIBRARY =
            "node_modules/@prisma/engines/libquery_engine-debian-openssl-3.0.x.so.node";
          PRISMA_SCHEMA_ENGINE_BINARY =
            "node_modules/@prisma/engines/schema-engine-debian-openssl-3.0.x";

          shellHook = ''
            export LD_LIBRARY_PATH="${pkgs.lib.makeLibraryPath [ pkgs.openssl pkgs.stdenv.cc.cc.lib ]}''${LD_LIBRARY_PATH:+:$LD_LIBRARY_PATH}"
          '';
        };
      });
}
