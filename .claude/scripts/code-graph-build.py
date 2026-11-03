#!/usr/bin/env python3
import json
import os
import re
from pathlib import Path

def build_code_graph(project_root):
    """Build code graph for symbol/import/call/test analysis"""
    graph = {
        "version": "1.0.0",
        "timestamp": "2026-11-03",
        "project": os.path.basename(project_root),
        "nodes": [],
        "edges": []
    }
    
    # Scan for Python/JS files
    extensions = {".py": "python", ".js": "javascript", ".ts": "typescript", ".tsx": "typescript"}
    
    for root, dirs, files in os.walk(project_root):
        # Skip common exclusions
        dirs[:] = [d for d in dirs if d not in [".git", "node_modules", "__pycache__", ".next", "dist"]]
        
        for file in files:
            ext = Path(file).suffix
            if ext in extensions:
                filepath = os.path.join(root, file)
                rel_path = os.path.relpath(filepath, project_root)
                
                # Create node
                node = {
                    "id": rel_path,
                    "type": extensions[ext],
                    "file": rel_path,
                    "symbols": [],
                    "imports": [],
                    "calls": []
                }
                
                # Parse for symbols (basic regex)
                try:
                    with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                        content = f.read()
                        
                        # Python functions
                        if ext == ".py":
                            node["symbols"] = re.findall(r"^def\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(", content, re.MULTILINE)
                            node["imports"] = re.findall(r"^from\s+([a-zA-Z0-9_.]+)\s+import|^import\s+([a-zA-Z0-9_.]+)", content, re.MULTILINE)
                        
                        # JavaScript/TypeScript functions
                        elif ext in [".js", ".ts", ".tsx"]:
                            node["symbols"] = re.findall(r"(?:export\s+)?(?:async\s+)?function\s+([a-zA-Z_][a-zA-Z0-9_]*)", content)
                            node["symbols"] += re.findall(r"(?:export\s+)?const\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(?:async\s+)?\(", content)
                            node["imports"] = re.findall(r"(?:import|from)\s+['\"]([^'\"]+)['\"]", content)
                        
                        graph["nodes"].append(node)
                except Exception as e:
                    pass
    
    # Build edges (simplified)
    for node in graph["nodes"]:
        for imp in node["imports"][:3]:  # Limit to 3 imports per file
            target = imp if isinstance(imp, str) else imp[0] or imp[1]
            if target:
                graph["edges"].append({
                    "from": node["id"],
                    "to": target,
                    "type": "import"
                })
    
    return graph

if __name__ == "__main__":
    import sys
    project_root = sys.argv[1] if len(sys.argv) > 1 else "."
    graph = build_code_graph(project_root)
    
    output_path = os.path.join(project_root, ".claude", "memory", "code-graph.json")
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    with open(output_path, "w") as f:
        json.dump(graph, f, indent=2)
    
    print(f"✓ Code graph built: {len(graph['nodes'])} files, {len(graph['edges'])} edges")
    print(f"  Output: {output_path}")
