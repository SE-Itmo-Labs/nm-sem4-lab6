#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import sys
from pathlib import Path

# Определяем корень проекта — текущая директория
PROJECT_ROOT = Path.cwd()
OUTPUT_DIR = PROJECT_ROOT / "deploy"
OUTPUT_FILE = OUTPUT_DIR / "PROJECT_STRUCTURE.txt"

# Имена файлов и расширения, которые будем читать
CODE_EXTENSIONS = {
    # Kotlin / Gradle
    '.kt', '.kts', '.gradle', '.gradle.kts', '.http',
    'build.gradle', 'settings.gradle', 'gradle.properties',
    # React / TypeScript / Vite / Redux
    # '.ts', '.tsx', '.js', '.jsx',
    '.json', '.yaml', '.yml', '.toml',
    '.md', '.java', '.fxml',
    '.env', '.env.local',
    # 'vite.config.js', 'vite.config.ts',
    'package.json', 'tsconfig.json', 'tsconfig.node.json',
    'webpack.config.js', 'babel.config.js',
    # '.gitignore', '.dockerignore',
    'Dockerfile'
}

# Явно включаем README, даже если не попадает по расширению
SPECIAL_FILES = {'README.md', 'readme.md'}

# Файлы, которые НЕ нужно включать, даже если они подходят по расширению
EXCLUDE_FILES = {
    'collection.json',
    'package-lock.json',
    'yarn.lock',
    'pnpm-lock.yaml',
    'package-lock.json',
    '.gitignore',  # можно оставить или убрать — оставил, т.к. иногда полезен
}

def should_include_file(file_path: Path) -> bool:
    name = file_path.name
    suffix = file_path.suffix

    # Исключаем явно запрещённые файлы
    if name in EXCLUDE_FILES:
        return False

    # Включаем специальные файлы
    if name in SPECIAL_FILES:
        return True

    # Включаем по расширению или полному имени
    if suffix in CODE_EXTENSIONS:
        return True
    if name in CODE_EXTENSIONS:
        return True

    return False

def generate_tree(root: Path) -> str:
    """Генерирует ASCII-дерево каталогов и файлов без .git и других служебных папок"""
    def _walk(path: Path, prefix: str = "", is_last: bool = True):
        if not path.is_dir():
            return

        # Фильтруем скрытые и служебные каталоги
        contents = [
            item for item in sorted(path.iterdir(), key=lambda x: (x.is_file(), x.name))
            if not (
                item.name.startswith('.') or
                item.name in ('node_modules', '__pycache__', 'build', 'dist', '.gradle', '.idea', 'venv', '.venv')
            )
        ]

        for i, item in enumerate(contents):
            is_last_item = (i == len(contents) - 1)
            connector = "└── " if is_last_item else "├── "
            yield prefix + connector + item.name

            if item.is_dir():
                extension = "    " if is_last_item else "│   "
                yield from _walk(item, prefix + extension, is_last_item)

    lines = [str(root.name) + "/"]
    yield from lines
    yield from _walk(root)

def safe_read_file(file_path: Path) -> str:
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return f.read()
    except UnicodeDecodeError:
        try:
            with open(file_path, 'r', encoding='latin-1') as f:
                return f.read()
        except Exception:
            return "[BINARY or UNREADABLE FILE]"
    except Exception:
        return "[ERROR READING FILE]"

def main():
    print("🔍 Analysing project structure...")

    OUTPUT_DIR.mkdir(exist_ok=True)

    # Собираем все подходящие файлы
    all_files = []
    for root, dirs, files in os.walk(PROJECT_ROOT):
        # Фильтруем каталоги при обходе
        dirs[:] = [
            d for d in dirs
            if not d.startswith('.') and d not in ('node_modules', '__pycache__', 'build', 'dist', '.gradle', '.idea', 'venv', '.venv')
        ]

        for file in files:
            full_path = Path(root) / file
            rel_path = full_path.relative_to(PROJECT_ROOT)
            if should_include_file(full_path):
                all_files.append(rel_path)

    all_files.sort()

    # Читаем README
#     readme_content = ""
#     readme_path = PROJECT_ROOT / "README.md"
#     if readme_path.exists():
#         readme_content = safe_read_file(readme_path)
#     else:
#         readme_content = "[README.md NOT FOUND]"

    # Генерируем дерево
    tree_str = "\n".join(generate_tree(PROJECT_ROOT))

    # Записываем результат
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as out:
        out.write("=========== PROJECT STRUCTURE ==============\n\n")

        out.write("Дерево\n")
        out.write(tree_str)
        out.write("\n\n")

#         out.write("ридми\n")
#         out.write(readme_content)
#         out.write("\n\n")

        for rel_path in all_files:
            full_path = PROJECT_ROOT / rel_path
            out.write(f"\n{rel_path}\n")
            out.write("\n")
            content = safe_read_file(full_path)
            out.write(content)
            out.write("\n\n")

        out.write("=========== PROJECT STRUCTURE ==============\n")

    print(f"✅ Отчёт сохранён в: {OUTPUT_FILE}")

if __name__ == "__main__":
    main()