# Semantic Analysis Implementation Plan

## Overview

This document describes the implementation plan for the semantic analyzer for the Tonto language. The semantic analyzer validates **Ontology Design Patterns (ODPs)** and provides coercion suggestions for incomplete patterns.

**Project:** SmallTonto - Tonto Language Parser  
**Module:** `apps/core/parser/ParserSemantic.py`  
**Status:** In Progress  
**Last Updated:** December 14, 2024

---

## Table of Contents

1. [Objectives](#1-objectives)
2. [Architecture Overview](#2-architecture-overview)
3. [Completed Work](#3-completed-work)
4. [Pending Implementation](#4-pending-implementation)
5. [Pattern Detection Rules](#5-pattern-detection-rules)
6. [Output Format](#6-output-format)
7. [Implementation Steps](#7-implementation-steps)
8. [Testing Strategy](#8-testing-strategy)

---

## 1. Objectives

Based on the requirements document (`requerimentos.md`), the semantic analyzer must:

### Primary Goals

1. **Detect complete ODP patterns** in Tonto code
2. **Detect incomplete ODP patterns** through overloading (partial matches)
3. **Provide coercion suggestions** to fix incomplete patterns
4. **Generate structured output** (dict/JSON) for integration with the viewer app

### Patterns to Validate

| Pattern | Description |
|---------|-------------|
| SubkindPattern | `kind` with `subkind` specializations and genset |
| RolePattern | `kind` with `role` specializations and genset |
| PhasePattern | `kind` with `phase` specializations and genset (disjoint mandatory) |
| RelatorPattern | `relator` with ≥2 `@mediation` relations and `@material` relation |
| ModePattern | `mode` with `@characterization` and `@externalDependence` relations |
| RoleMixinPattern | `roleMixin` with roles that specialize both kind and roleMixin |

### Evaluation Criteria (from requirements)

- Repository/Documentation: 2 pts
- Analysis Output (complete + incomplete patterns): 5 pts
- Video: 1 pt
- Error Handling (coercion technique): 2 pts

---

## 1.5 Key Concepts: Coercion and Overloading

This section explains how we apply compiler techniques to ODP validation.

### 1.5.1 Overloading in Pattern Detection

Pattern detection works like **function overloading** - same operation (detect pattern), different "signatures" (child stereotypes), different results:

| Signature Match | Pattern Result |
|-----------------|----------------|
| `kind` + `subkind` children | Subkind_Pattern |
| `kind` + `role` children | Role_Pattern |
| `kind` + `phase` children | Phase_Pattern |
| `relator` + `@mediation` relations | Relator_Pattern |
| `mode` + `@characterization` + `@externalDependence` | Mode_Pattern |
| `roleMixin` + dual-specializing `roles` | RoleMixin_Pattern |

**Partial matches** (e.g., kind with subkinds but no genset) are still detected via overloading and reported as **incomplete patterns**.

### 1.5.2 Coercion for Error Handling

Coercion is applied at **two levels**:

#### Level 1: Automatic Correction (True Coercion)

When a constraint violation has an **unambiguous fix**, we auto-correct it for validation purposes:

```python
# PhasePattern genset missing 'disjoint' - MANDATORY per requirements
# Coerce: treat AS IF disjoint exists for pattern completeness
if pattern_type == "Phase_Pattern" and genset and not genset.get('disjoint'):
    coerced_constraints = {"disjoint": True, ...}  # Auto-coerce
```

#### Level 2: Code Suggestion (Coercion Assistance)

We **always** provide code suggestions telling the user what to add/fix:

```python
suggestions.append({
    "type": "coercion",
    "action": "add_keyword",  # or "insert_code"
    "message": "Phase patterns require 'disjoint' keyword",
    "code_suggestion": "disjoint complete genset PersonPhases { ... }"
})
```

#### Coercion Decision Matrix

| Situation | Auto-Coerce? | Suggestion? |
|-----------|--------------|-------------|
| Phase genset missing `disjoint` | ✅ Yes (mandatory) | ✅ Yes |
| Subkind genset missing `disjoint` | ❌ No (optional) | ✅ Yes (recommended) |
| Role genset has `disjoint` | ❌ No (not applicable) | ⚠️ Warning |
| Missing genset entirely | ❌ No | ✅ Yes (full code) |
| Relator with <2 mediations | ❌ No | ✅ Yes (template) |

---

## 2. Architecture Overview

### Component Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         ParserSemantic                          │
│                                                                 │
│  ┌─────────────────┐    ┌─────────────────────────────────────┐ │
│  │   SymbolTable   │    │        Pattern Detection            │ │
│  │                 │    │                                     │ │
│  │  - classes      │───▶│  - _detect_subkind_patterns()       │ │
│  │  - relations    │    │  - _detect_role_patterns()          │ │
│  │  - gensets      │    │  - _detect_phase_patterns()         │ │
│  │  - datatypes    │    │  - _detect_relator_patterns()       │ │
│  │  - enums        │    │  - _detect_mode_patterns()          │ │
│  │  - primitives   │    │  - _detect_rolemixin_patterns()     │ │
│  └─────────────────┘    └─────────────────────────────────────┘ │
│                                        │                        │
│                                        ▼                        │
│                         ┌─────────────────────────────────────┐ │
│                         │     Pattern Validation & Coercion   │ │
│                         │                                     │ │
│                         │  - Validate pattern completeness    │ │
│                         │  - Generate violation messages      │ │
│                         │  - Generate code suggestions        │ │
│                         └─────────────────────────────────────┘ │
│                                        │                        │
│                                        ▼                        │
│                         ┌─────────────────────────────────────┐ │
│                         │         Output Generation           │ │
│                         │                                     │ │
│                         │  - Structured dict/JSON result      │ │
│                         │  - Complete patterns list           │ │
│                         │  - Incomplete patterns list         │ │
│                         │  - Summary statistics               │ │
│                         └─────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow

```
Tonto Code
    │
    ▼
┌──────────┐     ┌──────────┐     ┌────────────────┐     ┌─────────────┐
│  Lexer   │────▶│  Parser  │────▶│ ParserSemantic │────▶│   Output    │
│ (tokens) │     │  (AST)   │     │  (patterns)    │     │ (dict/JSON) │
└──────────┘     └──────────┘     └────────────────┘     └─────────────┘
```

---

## 3. Completed Work

### 3.1 Symbol Table (`SymbolTable` class)

**Location:** `apps/core/parser/ParserSemantic.py`  
**Status:** ✅ Complete and Tested

The Symbol Table collects and manages all named entities from a Tonto AST.

#### Storage Containers

| Container | Type | Description |
|-----------|------|-------------|
| `classes` | `dict` | Class definitions keyed by name |
| `relations` | `list` | Internal and external relations (no unique names) |
| `gensets` | `dict` | Generalization sets keyed by name |
| `datatypes` | `dict` | Datatype definitions keyed by name |
| `enums` | `dict` | Enum definitions keyed by name |
| `primitives` | `dict` | Built-in types (String, Number, Boolean, Date, Time, Datetime) |

#### Methods Implemented

**Add Methods:**
- `add_class(class_def: dict)` - Add a class definition
- `add_relation(relation_def: dict, source_class: str)` - Add a relation (enriches internal relations with source_class)
- `add_genset(genset_def: dict)` - Add a genset definition
- `add_datatype(datatype_def: dict)` - Add a datatype definition
- `add_enum(enum_def: dict)` - Add an enum definition

**Lookup Methods:**
- `get_class(class_name: str)` - Get class by name
- `get_genset(genset_name: str)` - Get genset by name
- `get_datatype(datatype_name: str)` - Get datatype by name
- `get_enum(enum_name: str)` - Get enum by name
- `resolve_type(type_name: str)` - Resolve any type (primitive > class > datatype > enum)
- `class_exists(class_name: str)` - Check if class exists
- `datatype_exists(datatype_name: str)` - Check if type exists

**Relationship Queries:**
- `get_classes_by_stereotype(stereotype: str)` - Get all classes with a stereotype
- `get_children_of(class_name: str, stereotype: str)` - Get classes that specialize a class
- `get_parents_of(class_name: str)` - Get parent classes of a class
- `get_gensets_for_general(class_name: str)` - Get gensets where class is general
- `get_genset_for_specific(class_name: str)` - Get gensets where class is specific
- `get_relations_for_class(class_name: str)` - Get all relations involving a class
- `get_internal_relations_of(class_name: str)` - Get internal relations of a class
- `get_relations_by_stereotype(stereotype: str)` - Get relations by stereotype

**Utility Methods:**
- `export()` - Export symbol table as dict
- `populate_from_ast(ast: dict)` - Populate from parsed AST
- `__repr__()` - String representation

#### Verified AST Compatibility

The Symbol Table correctly handles the AST structure produced by `MyParser`:

| AST Node Type | Stored Fields | Handling |
|---------------|---------------|----------|
| `class_definition` | `class_name`, `class_stereotype` (lowercase), `specialization`, `body` | ✅ |
| `internal_relation` | `relation_stereotype` (lowercase), `second_end`, `source_class` (added) | ✅ |
| `external_relation` | `relation_stereotype` (lowercase), `first_end`, `second_end` | ✅ |
| `genset_definition` | `genset_name`, `disjoint`, `complete`, `general`, `specifics` | ✅ |
| `datatype_definition` | `datatype_name`, `specialization`, `body` | ✅ |
| `enum_definition` | `enum_name`, `values` | ✅ |

**Important:** Stereotypes are stored as **lowercase strings** (e.g., `"kind"`, `"mediation"`), not token types.

### 3.2 Tests (`tests/test_semantic.py`)

**Status:** ✅ Complete

Tests implemented:
- `test_init_primitives` - Verify all 6 primitive types are loaded
- `test_primitives_match_token_types` - Verify sync with TokenType.py
- `test_resolve_type_primitive` - Resolve primitive types
- `test_resolve_type_unknown` - Unknown types return None
- `test_add_class` - Add and retrieve class
- `test_populate_from_ast_subkind_pattern` - Parse Subkind pattern
- `test_get_children_of` - Find child classes
- `test_get_parents_of` - Find parent classes
- `test_relator_with_mediations` - Collect internal relations from relator

---

## 4. Pending Implementation

### 4.1 TokenType.py Updates

**Status:** 🔲 Pending

Move shared utilities from `MyParser.py` to `TokenType.py`:

1. **`_is_similar(s1, s2, threshold)` function**
   - Levenshtein distance calculation
   - Used for typo detection in coercion suggestions

2. **Stereotype name helpers**
   - `get_class_stereotype_names()` - Returns list of valid class stereotype names
   - `get_relation_stereotype_names()` - Returns list of valid relation stereotype names

3. **Update MyParser.py**
   - Import `_is_similar` from TokenType instead of defining locally
   - Remove `VALID_STEREOTYPES` and `VALID_RELATION_STEREOTYPES` lists (use helpers)

### 4.2 ParserSemantic Class

**Status:** 🔲 Pending

Main semantic analyzer class to be implemented:

```python
class ParserSemantic:
    def __init__(self):
        self.symbol_table = None
        self.patterns = []              # Complete patterns
        self.incomplete_patterns = []   # Incomplete patterns
        self.errors = []                # Semantic errors
        self.warnings = []              # Semantic warnings
        self.imports = []               # Imported module names
    
    def analyze(self, ast: dict, filename: str = None) -> dict:
        """Main entry point - analyze AST and return results."""
        pass
```

### 4.3 Pattern Detection Methods

**Status:** 🔲 Pending

Six pattern detection methods to implement:

1. `_detect_subkind_patterns()`
2. `_detect_role_patterns()`
3. `_detect_phase_patterns()`
4. `_detect_relator_patterns()`
5. `_detect_mode_patterns()`
6. `_detect_rolemixin_patterns()`

### 4.4 Pattern Validation Methods

**Status:** 🔲 Pending

Validation methods for each pattern:

1. `_validate_subkind_pattern(pattern, genset)`
2. `_validate_role_pattern(pattern, genset)`
3. `_validate_phase_pattern(pattern, genset)`
4. `_validate_relator_pattern(pattern)`
5. `_validate_mode_pattern(pattern)`
6. `_validate_rolemixin_pattern(pattern, genset)`

### 4.5 Coercion Suggestion Methods

**Status:** 🔲 Pending

Methods to generate code suggestions:

1. `_suggest_genset(general, specifics, disjoint, complete)` - Generate genset code
2. `_suggest_mediation(class_name, target_class)` - Generate mediation relation
3. `_suggest_characterization(mode_name, target_class)` - Generate characterization
4. `_suggest_external_dependence(mode_name, target_class)` - Generate external dependence
5. `_suggest_material_relation(role1, role2)` - Generate material relation

### 4.6 Import Handling

**Status:** 🔲 Pending

For Phase A (single-file analysis):

- Collect imported module names from AST
- When a class reference cannot be resolved:
  - If name matches an import → Warning (assume exists)
  - If name doesn't match → Error (undefined reference)

---

## 5. Pattern Detection Rules

### 5.1 SubkindPattern

**Structure:**
```tonto
kind ClassName
subkind SubclassName1 specializes ClassName
subkind SubclassName2 specializes ClassName

disjoint complete genset Kind_Subkind_Genset {
    general ClassName
    specifics SubclassName1, SubclassName2
}
```

**Detection:**
1. Find all `kind` classes
2. For each `kind`, find `subkind` children
3. Check for matching genset

**Validation Rules:**
| Constraint | Requirement |
|------------|-------------|
| `disjoint` | APPLIES (should be present) |
| `complete` | OPTIONAL |
| Genset | SHOULD exist |

**Coercion for incomplete:**
- Missing genset → Suggest: `disjoint genset {name} { general X specifics Y, Z }`
- Missing disjoint → Suggest: Add `disjoint` keyword

---

### 5.2 RolePattern

**Structure:**
```tonto
kind ClassName
role Role_Name1 specializes ClassName
role Role_Name2 specializes ClassName

complete genset Class_Role_Genset {
    general ClassName
    specifics Role_Name1, Role_Name2
}
```

**Detection:**
1. Find all `kind` classes
2. For each `kind`, find `role` children
3. Check for matching genset

**Validation Rules:**
| Constraint | Requirement |
|------------|-------------|
| `disjoint` | DOES NOT APPLY |
| `complete` | OPTIONAL |
| Genset | SHOULD exist |

**Coercion for incomplete:**
- Missing genset → Suggest: `genset {name} { general X specifics Y, Z }`

---

### 5.3 PhasePattern

**Structure:**
```tonto
kind ClassName
phase Phase_Name1 specializes ClassName
phase Phase_Name2 specializes ClassName

disjoint complete genset Class_Phase_Genset {
    general ClassName
    specifics Phase_Name1, Phase_Name2
}
```

**Detection:**
1. Find all `kind` classes
2. For each `kind`, find `phase` children
3. Check for matching genset

**Validation Rules:**
| Constraint | Requirement |
|------------|-------------|
| `disjoint` | **MANDATORY** |
| `complete` | OPTIONAL |
| Genset | SHOULD exist |

**Coercion for incomplete:**
- Missing genset → Suggest: `disjoint genset {name} { general X specifics Y, Z }`
- Missing disjoint → **ERROR** + Suggest: Add `disjoint` keyword (required for phases)

---

### 5.4 RelatorPattern

**Structure:**
```tonto
kind ClassName1
kind ClassName2
role Role_Name1 specializes ClassName1
role Role_Name2 specializes ClassName2

relator Relator_Name {
    @mediation [1..*] -- [1..*] Role_Name1
    @mediation [1..*] -- [1..*] Role_Name2
}

@material relation Role_Name1 [1..*] -- relationName -- [1..*] Role_Name2
```

**Detection:**
1. Find all `relator` classes
2. Check for internal `@mediation` relations
3. Check for corresponding `@material` external relation

**Validation Rules:**
| Constraint | Requirement |
|------------|-------------|
| Mediations | **≥2 required** |
| Material relation | SHOULD exist |

**Coercion for incomplete:**
- <2 mediations → Suggest: Add `@mediation` relations
- Missing material → Suggest: `@material relation X [card] -- name -- [card] Y`

---

### 5.5 ModePattern

**Structure:**
```tonto
kind ClassName1
kind ClassName2

mode Mode_Name {
    @characterization [1..*] -- [1] ClassName1
    @externalDependence [1..*] -- [1] ClassName2
}
```

**Detection:**
1. Find all `mode` classes
2. Check for `@characterization` internal relation
3. Check for `@externalDependence` internal relation

**Validation Rules:**
| Constraint | Requirement |
|------------|-------------|
| `@characterization` | **REQUIRED** |
| `@externalDependence` | **REQUIRED** |

**Coercion for incomplete:**
- Missing characterization → Suggest: `@characterization [card] -- [card] ClassName`
- Missing externalDependence → Suggest: `@externalDependence [card] -- [card] ClassName`

---

### 5.6 RoleMixinPattern

**Structure:**
```tonto
kind ClassName1
kind ClassName2

roleMixin RoleMixin_Name

role Role_Name1 specializes ClassName1, RoleMixin_Name
role Role_Name2 specializes ClassName2, RoleMixin_Name

disjoint complete genset RoleMixin_Genset {
    general RoleMixin_Name
    specifics Role_Name1, Role_Name2
}
```

**Detection:**
1. Find all `roleMixin` classes
2. Find `role` classes that specialize BOTH a `kind` AND the `roleMixin`
3. Check for matching genset

**Validation Rules:**
| Constraint | Requirement |
|------------|-------------|
| Roles with dual specialization | **REQUIRED** |
| `disjoint` | APPLIES |
| `complete` | OPTIONAL |
| Genset | SHOULD exist |

**Coercion for incomplete:**
- Missing roles → Suggest: `role RoleName specializes SomeKind, RoleMixin`
- Missing genset → Suggest: `disjoint genset {name} { general RoleMixin specifics R1, R2 }`

---

## 6. Output Format

### 6.1 Complete Analysis Result

```python
{
    "ontology": None,  # Folder name for multi-file (Phase B)
    "files": [
        {
            "filename": "Example.tonto",
            "package": "ExamplePackage",
            "imports": ["OtherPackage"],
            "symbols": {
                "classes": [...],
                "relations": [...],
                "gensets": [...],
                "datatypes": [...],
                "enums": [...]
            },
            "patterns": [...],              # Complete patterns
            "incomplete_patterns": [...],   # Incomplete patterns
            "errors": [...],
            "warnings": [...]
        }
    ],
    "summary": {
        "total_patterns": 5,
        "complete_patterns": 3,
        "incomplete_patterns": 2,
        "pattern_counts": {
            "SubkindPattern": 1,
            "RolePattern": 2,
            "PhasePattern": 1,
            "RelatorPattern": 1,
            "ModePattern": 0,
            "RoleMixinPattern": 0
        }
    }
}
```

### 6.2 Pattern Object Structure

```python
{
    "pattern_type": "SubkindPattern",
    "status": "complete",  # or "incomplete"
    "anchor_class": "Person",
    "anchor_stereotype": "kind",
    "elements": {
        "general": "Person",
        "specifics": ["Child", "Adult"],
        "genset": "PersonPhases"  # or None if missing
    },
    "constraints": {
        "disjoint": True,
        "complete": False
    },
    "violations": [],  # Empty for complete patterns
    "suggestions": []  # Empty for complete patterns
}
```

### 6.3 Violation Object Structure

```python
{
    "code": "MISSING_GENSET",
    "severity": "warning",  # or "error"
    "message": "SubkindPattern requires a genset to formalize the generalization"
}
```

### 6.4 Suggestion Object Structure

```python
{
    "type": "coercion",
    "message": "Add a genset to formalize the subkind pattern",
    "code_suggestion": "disjoint genset Person_Subkinds {\n    general Person\n    specifics Child, Adult\n}"
}
```

---

## 7. Implementation Steps

### Step 1: Update TokenType.py

**Priority:** High  
**Estimated Effort:** Small

**Tasks:**
1. Add `_is_similar(s1, s2, threshold)` function (move from MyParser)
2. Add `get_class_stereotype_names()` helper
3. Add `get_relation_stereotype_names()` helper

**Files Modified:**
- `apps/core/lexer/TokenType.py`
- `apps/core/parser/MyParser.py` (update imports)

---

### Step 2: Implement ParserSemantic Class Structure

**Priority:** High  
**Estimated Effort:** Medium

**Tasks:**
1. Add `ParserSemantic` class skeleton
2. Implement `__init__()` method
3. Implement `analyze()` method (orchestration)
4. Implement `_build_result()` method (output formatting)
5. Implement `_check_class_reference()` for import handling

**File Modified:**
- `apps/core/parser/ParserSemantic.py`

---

### Step 3: Implement SubkindPattern Detection

**Priority:** High  
**Estimated Effort:** Medium

**Tasks:**
1. Implement `_detect_subkind_patterns()` method
2. Implement `_validate_subkind_pattern()` method
3. Implement `_find_matching_genset()` helper
4. Implement `_suggest_genset()` coercion helper
5. Add tests for SubkindPattern

**Files Modified:**
- `apps/core/parser/ParserSemantic.py`
- `apps/core/tests/test_semantic.py`

---

### Step 4: Implement RolePattern Detection

**Priority:** High  
**Estimated Effort:** Small (similar to SubkindPattern)

**Tasks:**
1. Implement `_detect_role_patterns()` method
2. Implement `_validate_role_pattern()` method
3. Add tests for RolePattern

**Files Modified:**
- `apps/core/parser/ParserSemantic.py`
- `apps/core/tests/test_semantic.py`

---

### Step 5: Implement PhasePattern Detection

**Priority:** High  
**Estimated Effort:** Small (similar to SubkindPattern with stricter validation)

**Tasks:**
1. Implement `_detect_phase_patterns()` method
2. Implement `_validate_phase_pattern()` method
3. Add tests for PhasePattern

**Files Modified:**
- `apps/core/parser/ParserSemantic.py`
- `apps/core/tests/test_semantic.py`

---

### Step 6: Implement RelatorPattern Detection

**Priority:** High  
**Estimated Effort:** Medium

**Tasks:**
1. Implement `_detect_relator_patterns()` method
2. Implement `_validate_relator_pattern()` method
3. Implement `_suggest_mediation()` coercion helper
4. Implement `_suggest_material_relation()` coercion helper
5. Add tests for RelatorPattern

**Files Modified:**
- `apps/core/parser/ParserSemantic.py`
- `apps/core/tests/test_semantic.py`

---

### Step 7: Implement ModePattern Detection

**Priority:** High  
**Estimated Effort:** Medium

**Tasks:**
1. Implement `_detect_mode_patterns()` method
2. Implement `_validate_mode_pattern()` method
3. Implement `_suggest_characterization()` coercion helper
4. Implement `_suggest_external_dependence()` coercion helper
5. Add tests for ModePattern

**Files Modified:**
- `apps/core/parser/ParserSemantic.py`
- `apps/core/tests/test_semantic.py`

---

### Step 8: Implement RoleMixinPattern Detection

**Priority:** High  
**Estimated Effort:** Medium (most complex pattern)

**Tasks:**
1. Implement `_detect_rolemixin_patterns()` method
2. Implement `_validate_rolemixin_pattern()` method
3. Add tests for RoleMixinPattern

**Files Modified:**
- `apps/core/parser/ParserSemantic.py`
- `apps/core/tests/test_semantic.py`

---

### Step 9: Integration Testing

**Priority:** High  
**Estimated Effort:** Medium

**Tasks:**
1. Test with example files from `examples/professor/Ontology Design Patterns em Tonto/`
2. Test with Hospital_Model examples
3. Test with Pizzaria_Model examples
4. Verify output format works with viewer app

**Files Modified:**
- `apps/core/tests/test_semantic.py`

---

### Step 10: Documentation

**Priority:** Medium  
**Estimated Effort:** Small

**Tasks:**
1. Update docstrings in ParserSemantic.py
2. Update README.md with semantic analysis usage
3. Add examples to documentation

**Files Modified:**
- `apps/core/parser/ParserSemantic.py`
- `apps/core/README.md`

---

## 8. Testing Strategy

### 8.1 Unit Tests

Each pattern should have tests for:
1. **Complete pattern detection** - All elements present
2. **Incomplete pattern detection** - Missing elements
3. **Coercion suggestions** - Correct suggestions generated
4. **Edge cases** - Empty body, no genset, etc.

### 8.2 Test Files

Use the example files as integration tests:

| Pattern | Test File |
|---------|-----------|
| SubkindPattern | `Subkind_Pattern.tonto` |
| RolePattern | `Role_Pattern.tonto` |
| PhasePattern | `Phase_Pattern.tonto` |
| RelatorPattern | `Relator_Pattern.tonto` |
| ModePattern | `Mode_Pattern.tonto` |
| RoleMixinPattern | `RoleMixin_Pattern.tonto` |

### 8.3 Run Tests

```bash
cd apps/core
source .venv/bin/activate
pytest tests/test_semantic.py -v
```

---

## Appendix A: Key Decisions

### A.1 Stereotype Storage Format

**Decision:** Stereotypes are stored as lowercase strings (e.g., `"kind"`, `"mediation"`)

**Rationale:** This is how the parser (`MyParser.py`) stores them in the AST. The lexer matches tokens but stores the original value.

### A.2 Pattern Detection Granularity

**Decision:** Per-class detection (each anchor class can start a pattern)

**Rationale:** 
- More precise error messages
- A single file can contain multiple patterns
- Easier to highlight patterns in the viewer

### A.3 Import Handling (Phase A)

**Decision:** Track imports as warnings, not errors

**Rationale:**
- Cannot resolve imports in single-file mode
- Patterns involving imported classes are still valid
- Sets up for Phase B (multi-file) later

### A.4 Output Format

**Decision:** Structured dict/JSON with `ontology` field for future expansion

**Rationale:**
- Easy integration with viewer app
- Supports future multi-file analysis
- JSON-serializable for API usage

### A.5 Type Reference Resolution

**Decision:** Type references accept both `CLASS_NAME` (e.g., enum types, custom classes) and `NEW_DATATYPE` (e.g., `CPFDataType`)

**Rationale:**
- Enums are commonly used as attribute types (e.g., `favoriteColor: Color`)
- Class types can be referenced in attributes (e.g., `address: Address`)
- The `NEW_DATATYPE` pattern (`*DataType` suffix) is available for stricter naming when desired
- Built-in primitives (`String`, `Number`, `Boolean`, `Date`, `Time`, `Datetime`) have their own token types

**Valid type references:**
| Type | Token | Example |
|------|-------|---------|
| Built-in primitives | `TYPE_*` | `String`, `Number`, `Boolean` |
| Custom datatypes | `NEW_DATATYPE` | `CPFDataType`, `PhoneNumberDataType` |
| Enum types | `CLASS_NAME` | `Color`, `Recheio_Da_Borda` |
| Other class types | `CLASS_NAME` | `Address`, `Person` |

---

## Appendix B: Related Files

| File | Purpose |
|------|---------|
| `apps/core/lexer/TokenType.py` | Token definitions, stereotypes, primitives |
| `apps/core/lexer/MyLexer.py` | Lexical analysis |
| `apps/core/parser/MyParser.py` | Syntax analysis, AST generation |
| `apps/core/parser/ParserSemantic.py` | Semantic analysis (this module) |
| `apps/core/tests/test_semantic.py` | Semantic analysis tests |
| `requerimentos.md` | Project requirements |
