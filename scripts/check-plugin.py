#!/usr/bin/env python3
"""Validate built distribution identity, theme providers, and license."""

from io import BytesIO
from pathlib import Path
import xml.etree.ElementTree as ET
from zipfile import ZipFile

ROOT = Path(__file__).resolve().parents[1]
properties = dict(
    line.split("=", 1) for line in (ROOT / "gradle.properties").read_text().splitlines()
    if "=" in line and not line.lstrip().startswith("#")
)
properties = {key.strip(): value.strip() for key, value in properties.items()}
version = properties["pluginVersion"]
with ZipFile(ROOT / f"build/distributions/deep-ocean-dark-{version}.zip") as distribution:
    plugins = []
    for name in distribution.namelist():
        if name.endswith(".jar"):
            with ZipFile(BytesIO(distribution.read(name))) as jar:
                if "META-INF/plugin.xml" in jar.namelist():
                    plugins.append(name)
                    plugin = ET.fromstring(jar.read("META-INF/plugin.xml"))
                    assert plugin.findtext("id") == "com.deepocean.theme"
                    assert plugin.findtext("name") == "Deep Ocean Dark"
                    assert plugin.findtext("version") == version
                    assert plugin.find("vendor").get("url") == properties["pluginRepositoryUrl"]
                    assert plugin.find("idea-version").get("since-build") == properties["pluginSinceBuild"]
                    assert jar.read("META-INF/LICENSE") == (ROOT / "LICENSE").read_bytes()
                    source = ET.parse(ROOT / "src/main/resources/META-INF/plugin.xml").getroot()
                    expected = [(p.get("id"), p.get("path")) for p in source.findall(".//themeProvider")]
                    assert len(expected) == 4
                    assert [(p.get("id"), p.get("path")) for p in plugin.findall(".//themeProvider")] == expected
                    for path in (ROOT / "src/main/resources").glob("deep_ocean*"):
                        assert jar.read(path.name) == path.read_bytes(), path.name
    assert len(plugins) == 1, plugins
print("Plugin distribution check passed.")
