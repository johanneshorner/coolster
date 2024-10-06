{
  buildNpmPackage,
}:

buildNpmPackage {
  pname = "coolster";
  version = "0.1.0";

  src = ./..;

  npmDepsHash = "sha256-fsWShgmg2d31VyO3fCrSighjn48vrc7ZOSku2XvbTP8=";

  installPhase = ''
    mkdir -p $out/usr/share/coolster/
    cp -r ./dist/ $out/usr/share/coolster/site
  '';

  meta = {
    description = "Recognize the song";
    homepage = "https://coolster.johanneshorner.com";
  };
}
