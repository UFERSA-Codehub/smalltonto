import pytest

from lexer.MyLexer import MyLexer
from parser.MyParser import MyParser
from parser.ParserSemantic import SymbolTable

@pytest.fixture
def parser():
    lexer = MyLexer()
    lexer.build()
    parser = MyParser(lexer)
    parser.build()
    return parser

@pytest.fixture
def parse_code(parser):
    def _parse(code):
        return parser.parse(code)
    return _parse

class TestSymbolTable:
    """Tests for SymbolTable class."""
    
    def test_primitives_match_token_types(self):
        """Primitives should match data_types from TokenType."""
        from lexer.TokenType import data_types
        
        st = SymbolTable()
        
        # Same count
        assert len(st.primitives) == len(data_types)
        
        # Same names
        for type_name in data_types.keys():
            assert type_name in st.primitives, f"Missing primitive from TokenType: {type_name}"


    def test_resolve_type_primitive(self):
        """Should resolve primitive types."""
        st = SymbolTable()
        result = st.resolve_type("String")
        assert result is not None
        assert result["name"] == "String"
    def test_resolve_type_unknown(self):
        """Should return None for unknown types."""
        st = SymbolTable()
        result = st.resolve_type("UnknownType")
        assert result is None
    def test_add_class(self):
        """Should add class to symbol table."""
        st = SymbolTable()
        class_def = {
            "node_type": "class_definition",
            "class_name": "Person",
            "class_stereotype": "kind",
            "specialization": None,
            "body": None
        }
        st.add_class(class_def)
        assert "Person" in st.classes
        assert st.get_class("Person") == class_def
    def test_populate_from_ast_subkind_pattern(self, parse_code):
        """Should populate from Subkind Pattern AST."""
        code = """
        package TestPackage
        
        kind ClassName
        subkind SubclassName1 specializes ClassName
        subkind SubclassName2 specializes ClassName
        
        disjoint complete genset Kind_Subkind_Genset {
            general ClassName
            specifics SubclassName1, SubclassName2
        }
        """
        ast = parse_code(code)
        
        st = SymbolTable()
        st.populate_from_ast(ast)
        
        # Check classes
        assert len(st.classes) == 3
        assert "ClassName" in st.classes
        assert "SubclassName1" in st.classes
        assert "SubclassName2" in st.classes
        
        # Check stereotypes
        assert st.get_class("ClassName")["class_stereotype"] == "kind"
        assert st.get_class("SubclassName1")["class_stereotype"] == "subkind"
        
        # Check genset
        assert len(st.gensets) == 1
        assert "Kind_Subkind_Genset" in st.gensets
        
        genset = st.get_genset("Kind_Subkind_Genset")
        assert genset["disjoint"] == True
        assert genset["complete"] == True
        assert genset["general"] == "ClassName"
        assert "SubclassName1" in genset["specifics"]
        assert "SubclassName2" in genset["specifics"]
    def test_get_children_of(self, parse_code):
        """Should find children of a class."""
        code = """
        package TestPackage
        kind Parent
        subkind Child1 specializes Parent
        subkind Child2 specializes Parent
        role Child3 specializes Parent
        """
        ast = parse_code(code)
        
        st = SymbolTable()
        st.populate_from_ast(ast)
        
        # All children
        children = st.get_children_of("Parent")
        assert len(children) == 3
        
        # Only subkinds
        subkinds = st.get_children_of("Parent", stereotype="subkind")
        assert len(subkinds) == 2
        
        # Only roles
        roles = st.get_children_of("Parent", stereotype="role")
        assert len(roles) == 1
    def test_get_parents_of(self, parse_code):
        """Should find parents of a class."""
        code = """
        package TestPackage
        kind Parent1
        kind Parent2
        role Child specializes Parent1, Parent2
        """
        ast = parse_code(code)
        
        st = SymbolTable()
        st.populate_from_ast(ast)
        
        parents = st.get_parents_of("Child")
        assert len(parents) == 2
        assert "Parent1" in parents
        assert "Parent2" in parents
    def test_relator_with_mediations(self, parse_code):
        """Should collect internal relations from relator."""
        code = """
        package TestPackage
        kind Person
        role Employee specializes Person
        
        relator Employment {
            @mediation [1..*] -- [1] Employee
            @mediation [1..*] -- [1] Person
        }
        """
        ast = parse_code(code)
        
        st = SymbolTable()
        st.populate_from_ast(ast)
        
        # Check relator exists
        assert "Employment" in st.classes
        assert st.get_class("Employment")["class_stereotype"] == "relator"
        
        # Check internal relations
        mediations = st.get_internal_relations_of("Employment")
        assert len(mediations) == 2
        
        for med in mediations:
            assert med["relation_stereotype"] == "mediation"
            assert med["source_class"] == "Employment"