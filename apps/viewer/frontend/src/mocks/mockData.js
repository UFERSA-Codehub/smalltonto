/**
 * Mock data for development mode testing.
 * Contains pre-parsed AST data for testing the diagram without the Python backend.
 *
 * Switch between scenarios using: window.setMockScenario('consultaMedica') or window.setMockScenario('carOwnership')
 */

// ConsultaMedica.tonto - Relator pattern with mediations, material relation, and enum
export const consultaMedicaData = {
  content: `import Paciente
import FuncionarioDaUBS

package ConsultaMedica

//=============================================
// RELACAO ENTRE PACIENTE E MEDICO

@material relation Paciente [1..*] -- consultado_Por -- [1..*] Medico

relator Consulta_Medica {
    tipo_De_Consulta : Tipo_De_Consulta

    @mediation [1..*] -- [1] Paciente
    @mediation [1..*] -- [1] Medico
}

enum Tipo_De_Consulta {
    Acompanhamento_Pediatrico01,
    Atendimento_PreNatal02,
    Atendimento_Odontologico03,
    Consulta_Clinica_Geral04
}
`,
  ast: {
    node_type: "tonto_file",
    imports: [
      { node_type: "import_statement", module_name: "Paciente", line: 1, column: 1 },
      { node_type: "import_statement", module_name: "FuncionarioDaUBS", line: 2, column: 1 },
    ],
    package: {
      node_type: "package_declaration",
      package_name: "ConsultaMedica",
      line: 4,
      column: 1,
    },
    content: [
      {
        node_type: "external_relation",
        relation_stereotype: "material",
        first_end: "Paciente",
        first_cardinality: { node_type: "cardinality", min: 1, max: "*" },
        operator_left: "--",
        relation_name: "consultado_Por",
        operator_right: "--",
        second_cardinality: { node_type: "cardinality", min: 1, max: "*" },
        second_end: "Medico",
        line: 9,
        column: 1,
      },
      {
        node_type: "class_definition",
        class_stereotype: "relator",
        class_name: "Consulta_Medica",
        specialization: null,
        body: [
          {
            node_type: "attribute",
            attribute_name: "tipo_De_Consulta",
            attribute_type: "Tipo_De_Consulta",
            cardinality: null,
            meta_attributes: null,
            line: 12,
            column: 1,
          },
          {
            node_type: "internal_relation",
            relation_stereotype: "mediation",
            first_end: null,
            first_cardinality: { node_type: "cardinality", min: 1, max: "*" },
            operator_left: "--",
            relation_name: null,
            operator_right: null,
            second_cardinality: { node_type: "cardinality", min: 1, max: 1 },
            second_end: "Paciente",
            line: 14,
            column: 1,
          },
          {
            node_type: "internal_relation",
            relation_stereotype: "mediation",
            first_end: null,
            first_cardinality: { node_type: "cardinality", min: 1, max: "*" },
            operator_left: "--",
            relation_name: null,
            operator_right: null,
            second_cardinality: { node_type: "cardinality", min: 1, max: 1 },
            second_end: "Medico",
            line: 15,
            column: 1,
          },
        ],
        line: 11,
        column: 1,
      },
      {
        node_type: "enum_definition",
        enum_name: "Tipo_De_Consulta",
        specialization: null,
        values: [
          "Acompanhamento_Pediatrico01",
          "Atendimento_PreNatal02",
          "Atendimento_Odontologico03",
          "Consulta_Clinica_Geral04",
        ],
        line: 18,
        column: 1,
      },
    ],
  },
  semantic: {
    symbols: {
      classes: [
        {
          node_type: "class_definition",
          class_stereotype: "relator",
          class_name: "Consulta_Medica",
          specialization: null,
          body: [
            {
              node_type: "attribute",
              attribute_name: "tipo_De_Consulta",
              attribute_type: "Tipo_De_Consulta",
              cardinality: null,
              meta_attributes: null,
              line: 12,
              column: 1,
            },
            {
              node_type: "internal_relation",
              relation_stereotype: "mediation",
              first_end: null,
              first_cardinality: { node_type: "cardinality", min: 1, max: "*" },
              operator_left: "--",
              relation_name: null,
              operator_right: null,
              second_cardinality: { node_type: "cardinality", min: 1, max: 1 },
              second_end: "Paciente",
              line: 14,
              column: 1,
            },
            {
              node_type: "internal_relation",
              relation_stereotype: "mediation",
              first_end: null,
              first_cardinality: { node_type: "cardinality", min: 1, max: "*" },
              operator_left: "--",
              relation_name: null,
              operator_right: null,
              second_cardinality: { node_type: "cardinality", min: 1, max: 1 },
              second_end: "Medico",
              line: 15,
              column: 1,
            },
          ],
          line: 11,
          column: 1,
        },
      ],
      relations: [
        {
          node_type: "external_relation",
          relation_stereotype: "material",
          first_end: "Paciente",
          first_cardinality: { node_type: "cardinality", min: 1, max: "*" },
          operator_left: "--",
          relation_name: "consultado_Por",
          operator_right: "--",
          second_cardinality: { node_type: "cardinality", min: 1, max: "*" },
          second_end: "Medico",
          line: 9,
          column: 1,
        },
        {
          node_type: "internal_relation",
          relation_stereotype: "mediation",
          first_end: null,
          first_cardinality: { node_type: "cardinality", min: 1, max: "*" },
          operator_left: "--",
          relation_name: null,
          operator_right: null,
          second_cardinality: { node_type: "cardinality", min: 1, max: 1 },
          second_end: "Paciente",
          line: 14,
          column: 1,
          source_class: "Consulta_Medica",
        },
        {
          node_type: "internal_relation",
          relation_stereotype: "mediation",
          first_end: null,
          first_cardinality: { node_type: "cardinality", min: 1, max: "*" },
          operator_left: "--",
          relation_name: null,
          operator_right: null,
          second_cardinality: { node_type: "cardinality", min: 1, max: 1 },
          second_end: "Medico",
          line: 15,
          column: 1,
          source_class: "Consulta_Medica",
        },
      ],
      gensets: [],
      datatypes: [],
      enums: [
        {
          node_type: "enum_definition",
          enum_name: "Tipo_De_Consulta",
          specialization: null,
          values: [
            "Acompanhamento_Pediatrico01",
            "Atendimento_PreNatal02",
            "Atendimento_Odontologico03",
            "Consulta_Clinica_Geral04",
          ],
          line: 18,
          column: 1,
        },
      ],
    },
    patterns: [],
    incomplete_patterns: [],
    summary: {
      total_patterns: 0,
      complete_patterns: 0,
      incomplete_patterns: 0,
      pattern_counts: {
        Subkind_Pattern: 0,
        Role_Pattern: 0,
        Phase_Pattern: 0,
        Relator_Pattern: 0,
        Mode_Pattern: 0,
        RoleMixin_Pattern: 0,
      },
    },
  },
};

// CarOwnership (example2.tonto) - Relator with mediations, subkind with generalization
export const carOwnershipData = {
  content: `package CarOwnership 

kind Organization
subkind CarAgency specializes Organization
kind Car

relator CarOwnership {
    @mediation
    -- involvesOwner -- [1] CarAgency

    @mediation
    -- involvesProperty -- [1] Car
}
`,
  ast: {
    node_type: "tonto_file",
    imports: [],
    package: {
      node_type: "package_declaration",
      package_name: "CarOwnership",
      line: 1,
      column: 1,
    },
    content: [
      {
        node_type: "class_definition",
        class_stereotype: "kind",
        class_name: "Organization",
        specialization: null,
        body: null,
        line: 3,
        column: 1,
      },
      {
        node_type: "class_definition",
        class_stereotype: "subkind",
        class_name: "CarAgency",
        specialization: {
          node_type: "specialization",
          parents: ["Organization"],
        },
        body: null,
        line: 4,
        column: 1,
      },
      {
        node_type: "class_definition",
        class_stereotype: "kind",
        class_name: "Car",
        specialization: null,
        body: null,
        line: 5,
        column: 1,
      },
      {
        node_type: "class_definition",
        class_stereotype: "relator",
        class_name: "CarOwnership",
        specialization: null,
        body: [
          {
            node_type: "internal_relation",
            relation_stereotype: "mediation",
            first_end: null,
            first_cardinality: null,
            operator_left: "--",
            relation_name: "involvesOwner",
            operator_right: "--",
            second_cardinality: { node_type: "cardinality", min: 1, max: 1 },
            second_end: "CarAgency",
            line: 9,
            column: 1,
          },
          {
            node_type: "internal_relation",
            relation_stereotype: "mediation",
            first_end: null,
            first_cardinality: null,
            operator_left: "--",
            relation_name: "involvesProperty",
            operator_right: "--",
            second_cardinality: { node_type: "cardinality", min: 1, max: 1 },
            second_end: "Car",
            line: 12,
            column: 1,
          },
        ],
        line: 7,
        column: 1,
      },
    ],
  },
  semantic: {
    symbols: {
      classes: [
        {
          node_type: "class_definition",
          class_stereotype: "kind",
          class_name: "Organization",
          specialization: null,
          body: null,
          line: 3,
          column: 1,
        },
        {
          node_type: "class_definition",
          class_stereotype: "subkind",
          class_name: "CarAgency",
          specialization: {
            node_type: "specialization",
            parents: ["Organization"],
          },
          body: null,
          line: 4,
          column: 1,
        },
        {
          node_type: "class_definition",
          class_stereotype: "kind",
          class_name: "Car",
          specialization: null,
          body: null,
          line: 5,
          column: 1,
        },
        {
          node_type: "class_definition",
          class_stereotype: "relator",
          class_name: "CarOwnership",
          specialization: null,
          body: [
            {
              node_type: "internal_relation",
              relation_stereotype: "mediation",
              first_end: null,
              first_cardinality: null,
              operator_left: "--",
              relation_name: "involvesOwner",
              operator_right: "--",
              second_cardinality: { node_type: "cardinality", min: 1, max: 1 },
              second_end: "CarAgency",
              line: 9,
              column: 1,
            },
            {
              node_type: "internal_relation",
              relation_stereotype: "mediation",
              first_end: null,
              first_cardinality: null,
              operator_left: "--",
              relation_name: "involvesProperty",
              operator_right: "--",
              second_cardinality: { node_type: "cardinality", min: 1, max: 1 },
              second_end: "Car",
              line: 12,
              column: 1,
            },
          ],
          line: 7,
          column: 1,
        },
      ],
      relations: [
        {
          node_type: "internal_relation",
          relation_stereotype: "mediation",
          first_end: null,
          first_cardinality: null,
          operator_left: "--",
          relation_name: "involvesOwner",
          operator_right: "--",
          second_cardinality: { node_type: "cardinality", min: 1, max: 1 },
          second_end: "CarAgency",
          line: 9,
          column: 1,
          source_class: "CarOwnership",
        },
        {
          node_type: "internal_relation",
          relation_stereotype: "mediation",
          first_end: null,
          first_cardinality: null,
          operator_left: "--",
          relation_name: "involvesProperty",
          operator_right: "--",
          second_cardinality: { node_type: "cardinality", min: 1, max: 1 },
          second_end: "Car",
          line: 12,
          column: 1,
          source_class: "CarOwnership",
        },
      ],
      gensets: [],
      datatypes: [],
      enums: [],
    },
    patterns: [],
    incomplete_patterns: [
      {
        pattern_type: "Subkind_Pattern",
        status: "incomplete",
        anchor_class: "Organization",
        anchor_stereotype: "kind",
        elements: {
          general: "Organization",
          specifics: ["CarAgency"],
          genset: null,
        },
        constraints: {
          disjoint: false,
          complete: false,
        },
        violations: [
          {
            code: "MISSING_GENSET",
            severity: "warning",
            message: "Subkind_Pattern for 'Organization' should have a genset to formalize the generalization",
            line: 3,
            column: 1,
          },
        ],
        suggestions: [
          {
            type: "coercion",
            action: "insert_code",
            message: "Add a genset to formalize the subkind pattern",
            code_suggestion:
              "disjoint genset Organization_Genset {\n    general Organization\n    specifics CarAgency\n}",
          },
        ],
      },
    ],
    summary: {
      total_patterns: 1,
      complete_patterns: 0,
      incomplete_patterns: 1,
      pattern_counts: {
        Subkind_Pattern: 1,
        Role_Pattern: 0,
        Phase_Pattern: 0,
        Relator_Pattern: 0,
        Mode_Pattern: 0,
        RoleMixin_Pattern: 0,
      },
    },
  },
  warnings: [
    {
      code: "MISSING_GENSET",
      severity: "warning",
      message: "Subkind_Pattern for 'Organization' should have a genset to formalize the generalization",
      line: 3,
      column: 1,
      pattern_type: "Subkind_Pattern",
      anchor_class: "Organization",
      suggestion: {
        type: "coercion",
        action: "insert_code",
        message: "Add a genset to formalize the subkind pattern",
        code_suggestion: "disjoint genset Organization_Genset {\n    general Organization\n    specifics CarAgency\n}",
      },
    },
  ],
};

// Deep hierarchy test - Cobertura_da_Pizza pattern with multi-level generalization
export const coberturaPizzaData = {
  content: `package Cobertura_Da_Pizza

kind Cobertura_Da_Pizza

subkind Carne specializes Cobertura_Da_Pizza
subkind Fruto_Do_Mar specializes Cobertura_Da_Pizza
subkind Queijo specializes Cobertura_Da_Pizza
subkind Vegetal specializes Cobertura_Da_Pizza

subkind Calabresa specializes Carne
subkind Presunto specializes Carne
subkind Frango specializes Carne

subkind Camarao specializes Fruto_Do_Mar
subkind Polvo specializes Fruto_Do_Mar

disjoint complete genset Tipo_Cobertura {
    general Cobertura_Da_Pizza
    specifics Carne, Fruto_Do_Mar, Queijo, Vegetal
}
`,
  ast: {
    node_type: "tonto_file",
    imports: [],
    package: {
      node_type: "package_declaration",
      package_name: "Cobertura_Da_Pizza",
      line: 1,
      column: 1,
    },
    content: [],
  },
  semantic: {
    symbols: {
      classes: [
        {
          node_type: "class_definition",
          class_stereotype: "kind",
          class_name: "Cobertura_Da_Pizza",
          specialization: null,
          body: null,
          line: 3,
          column: 1,
        },
        {
          node_type: "class_definition",
          class_stereotype: "subkind",
          class_name: "Carne",
          specialization: { node_type: "specialization", parents: ["Cobertura_Da_Pizza"] },
          body: null,
          line: 5,
          column: 1,
        },
        {
          node_type: "class_definition",
          class_stereotype: "subkind",
          class_name: "Fruto_Do_Mar",
          specialization: { node_type: "specialization", parents: ["Cobertura_Da_Pizza"] },
          body: null,
          line: 6,
          column: 1,
        },
        {
          node_type: "class_definition",
          class_stereotype: "subkind",
          class_name: "Queijo",
          specialization: { node_type: "specialization", parents: ["Cobertura_Da_Pizza"] },
          body: null,
          line: 7,
          column: 1,
        },
        {
          node_type: "class_definition",
          class_stereotype: "subkind",
          class_name: "Vegetal",
          specialization: { node_type: "specialization", parents: ["Cobertura_Da_Pizza"] },
          body: null,
          line: 8,
          column: 1,
        },
        {
          node_type: "class_definition",
          class_stereotype: "subkind",
          class_name: "Calabresa",
          specialization: { node_type: "specialization", parents: ["Carne"] },
          body: null,
          line: 10,
          column: 1,
        },
        {
          node_type: "class_definition",
          class_stereotype: "subkind",
          class_name: "Presunto",
          specialization: { node_type: "specialization", parents: ["Carne"] },
          body: null,
          line: 11,
          column: 1,
        },
        {
          node_type: "class_definition",
          class_stereotype: "subkind",
          class_name: "Frango",
          specialization: { node_type: "specialization", parents: ["Carne"] },
          body: null,
          line: 12,
          column: 1,
        },
        {
          node_type: "class_definition",
          class_stereotype: "subkind",
          class_name: "Camarao",
          specialization: { node_type: "specialization", parents: ["Fruto_Do_Mar"] },
          body: null,
          line: 14,
          column: 1,
        },
        {
          node_type: "class_definition",
          class_stereotype: "subkind",
          class_name: "Polvo",
          specialization: { node_type: "specialization", parents: ["Fruto_Do_Mar"] },
          body: null,
          line: 15,
          column: 1,
        },
      ],
      relations: [],
      gensets: [
        {
          node_type: "genset_definition",
          is_disjoint: true,
          is_complete: true,
          genset_name: "Tipo_Cobertura",
          general: "Cobertura_Da_Pizza",
          specifics: ["Carne", "Fruto_Do_Mar", "Queijo", "Vegetal"],
          line: 17,
          column: 1,
        },
      ],
      datatypes: [],
      enums: [],
    },
    patterns: [],
    incomplete_patterns: [],
    summary: {
      total_patterns: 0,
      complete_patterns: 0,
      incomplete_patterns: 0,
      pattern_counts: {
        Subkind_Pattern: 0,
        Role_Pattern: 0,
        Phase_Pattern: 0,
        Relator_Pattern: 0,
        Mode_Pattern: 0,
        RoleMixin_Pattern: 0,
      },
    },
  },
};

// CarRental example - Complex hierarchy with relator mediating deep specialization chains
export const carRentalData = {
  content: `package CarRental 

kind Person

role Employee specializes Person
role ResponsibleEmployee specializes Employee

phase DeceasedPerson specializes Person
phase LivingPerson specializes Person

phase Child specializes LivingPerson
phase Teenager specializes LivingPerson
phase Adult specializes LivingPerson

disjoint complete genset AgePhase {
    general LivingPerson
    specifics Child, Teenager, Adult
}

disjoint complete genset LifeStatus {
    general Person
    specifics DeceasedPerson, LivingPerson
}

roleMixin Customer

role PersonalCustomer specializes Customer, Person

kind Organization

role CorporateCustomer specializes Organization

kind Car

phase AvailableCar specializes Car
phase UnderMaintenanceCar specializes Car

role RentalCar specializes AvailableCar

relator CarRental {
    @mediation
    -- involvesRental -- [1] RentalCar
    
    -- involvesMediator -- [1] ResponsibleEmployee
    
    @mediation
    -- involvesCustomer --[1] Customer
}
`,
  ast: {
    node_type: "tonto_file",
    imports: [],
    package: {
      node_type: "package_declaration",
      package_name: "CarRental",
      line: 1,
      column: 1,
    },
    content: [],
  },
  semantic: {
    symbols: {
      classes: [
        { node_type: "class_definition", class_stereotype: "kind", class_name: "Person", specialization: null, body: null, line: 3, column: 1 },
        { node_type: "class_definition", class_stereotype: "role", class_name: "Employee", specialization: { node_type: "specialization", parents: ["Person"] }, body: null, line: 5, column: 1 },
        { node_type: "class_definition", class_stereotype: "role", class_name: "ResponsibleEmployee", specialization: { node_type: "specialization", parents: ["Employee"] }, body: null, line: 6, column: 1 },
        { node_type: "class_definition", class_stereotype: "phase", class_name: "DeceasedPerson", specialization: { node_type: "specialization", parents: ["Person"] }, body: null, line: 8, column: 1 },
        { node_type: "class_definition", class_stereotype: "phase", class_name: "LivingPerson", specialization: { node_type: "specialization", parents: ["Person"] }, body: null, line: 9, column: 1 },
        { node_type: "class_definition", class_stereotype: "phase", class_name: "Child", specialization: { node_type: "specialization", parents: ["LivingPerson"] }, body: null, line: 11, column: 1 },
        { node_type: "class_definition", class_stereotype: "phase", class_name: "Teenager", specialization: { node_type: "specialization", parents: ["LivingPerson"] }, body: null, line: 12, column: 1 },
        { node_type: "class_definition", class_stereotype: "phase", class_name: "Adult", specialization: { node_type: "specialization", parents: ["LivingPerson"] }, body: null, line: 13, column: 1 },
        { node_type: "class_definition", class_stereotype: "roleMixin", class_name: "Customer", specialization: null, body: null, line: 25, column: 1 },
        { node_type: "class_definition", class_stereotype: "role", class_name: "PersonalCustomer", specialization: { node_type: "specialization", parents: ["Customer", "Person"] }, body: null, line: 27, column: 1 },
        { node_type: "class_definition", class_stereotype: "kind", class_name: "Organization", specialization: null, body: null, line: 29, column: 1 },
        { node_type: "class_definition", class_stereotype: "role", class_name: "CorporateCustomer", specialization: { node_type: "specialization", parents: ["Organization"] }, body: null, line: 31, column: 1 },
        { node_type: "class_definition", class_stereotype: "kind", class_name: "Car", specialization: null, body: null, line: 33, column: 1 },
        { node_type: "class_definition", class_stereotype: "phase", class_name: "AvailableCar", specialization: { node_type: "specialization", parents: ["Car"] }, body: null, line: 35, column: 1 },
        { node_type: "class_definition", class_stereotype: "phase", class_name: "UnderMaintenanceCar", specialization: { node_type: "specialization", parents: ["Car"] }, body: null, line: 36, column: 1 },
        { node_type: "class_definition", class_stereotype: "role", class_name: "RentalCar", specialization: { node_type: "specialization", parents: ["AvailableCar"] }, body: null, line: 38, column: 1 },
        {
          node_type: "class_definition",
          class_stereotype: "relator",
          class_name: "CarRental",
          specialization: null,
          body: [
            { node_type: "internal_relation", relation_stereotype: "mediation", first_end: null, first_cardinality: null, operator_left: "--", relation_name: "involvesRental", operator_right: "--", second_cardinality: { node_type: "cardinality", min: 1, max: 1 }, second_end: "RentalCar", line: 42, column: 1 },
            { node_type: "internal_relation", relation_stereotype: null, first_end: null, first_cardinality: null, operator_left: "--", relation_name: "involvesMediator", operator_right: "--", second_cardinality: { node_type: "cardinality", min: 1, max: 1 }, second_end: "ResponsibleEmployee", line: 44, column: 1 },
            { node_type: "internal_relation", relation_stereotype: "mediation", first_end: null, first_cardinality: null, operator_left: "--", relation_name: "involvesCustomer", operator_right: "--", second_cardinality: { node_type: "cardinality", min: 1, max: 1 }, second_end: "Customer", line: 47, column: 1 },
          ],
          line: 40,
          column: 1,
        },
      ],
      relations: [
        { node_type: "internal_relation", relation_stereotype: "mediation", first_end: null, first_cardinality: null, operator_left: "--", relation_name: "involvesRental", operator_right: "--", second_cardinality: { node_type: "cardinality", min: 1, max: 1 }, second_end: "RentalCar", line: 42, column: 1, source_class: "CarRental" },
        { node_type: "internal_relation", relation_stereotype: "mediation", first_end: null, first_cardinality: null, operator_left: "--", relation_name: "involvesCustomer", operator_right: "--", second_cardinality: { node_type: "cardinality", min: 1, max: 1 }, second_end: "Customer", line: 47, column: 1, source_class: "CarRental" },
      ],
      gensets: [
        { node_type: "genset_definition", is_disjoint: true, is_complete: true, genset_name: "AgePhase", general: "LivingPerson", specifics: ["Child", "Teenager", "Adult"], line: 15, column: 1 },
        { node_type: "genset_definition", is_disjoint: true, is_complete: true, genset_name: "LifeStatus", general: "Person", specifics: ["DeceasedPerson", "LivingPerson"], line: 20, column: 1 },
      ],
      datatypes: [],
      enums: [],
    },
    patterns: [],
    incomplete_patterns: [],
    summary: {
      total_patterns: 0,
      complete_patterns: 0,
      incomplete_patterns: 0,
      pattern_counts: {
        Subkind_Pattern: 0,
        Role_Pattern: 0,
        Phase_Pattern: 0,
        Relator_Pattern: 0,
        Mode_Pattern: 0,
        RoleMixin_Pattern: 0,
      },
    },
  },
};

// Export all scenarios
export const mockScenarios = {
  consultaMedica: consultaMedicaData,
  carOwnership: carOwnershipData,
  coberturaPizza: coberturaPizzaData,
  carRental: carRentalData,
};

// Default scenario
export const defaultScenario = "consultaMedica";
