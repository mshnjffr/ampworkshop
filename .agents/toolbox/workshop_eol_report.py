#!/usr/bin/env python3
# amp-workshop/.agents/toolbox/workshop_eol_report.py
import os, sys, json, subprocess, re, glob, urllib.request
import urllib.parse

def describe():
    print(json.dumps({
        "name": "workshop_eol_report",
        "description": "Scan the repo and report EOL status for nodejs and common runtimes (sqlite, mysql, react).",
        "inputSchema": {"type":"object","properties":{"dir":{"type":"string"}}, "required":[]}
    }))

def fetch(product):
    url = f"https://endoflife.date/api/{urllib.parse.quote(product)}.json"
    with urllib.request.urlopen(urllib.request.Request(url, headers={"Accept":"application/json"})) as r:
        return json.loads(r.read().decode("utf-8"))

def execute():
    data = sys.stdin.read().strip()
    params = json.loads(data) if data else {}
    root = params.get("dir", "amp-workshop")

    products = {"nodejs"}  # Always check Node
    # Heuristics based on dependencies in the repo
    for pj in glob.glob(os.path.join(root, "**/package.json"), recursive=True):
        txt = open(pj, "r", encoding="utf-8").read()
        if '"sqlite3"' in txt: products.add("sqlite")
        if '"mysql"' in txt: products.add("mysql")
        if '"react"' in txt: products.add("react")

    report = {}
    for p in sorted(products):
        try:
            report[p] = fetch(p)
        except Exception as e:
            report[p] = {"error": str(e)}

    print(json.dumps({"checked": sorted(products), "results": report}, indent=2))

if __name__ == "__main__":
    action = os.environ.get("TOOLBOX_ACTION")
    if action == "describe": describe()
    elif action == "execute": execute()
    else:
        print("Error: set TOOLBOX_ACTION=describe|execute", file=sys.stderr); sys.exit(1)