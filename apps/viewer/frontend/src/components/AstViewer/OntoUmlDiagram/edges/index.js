import GeneralizationEdge from "./GeneralizationEdge";
import AssociationEdge from "./AssociationEdge";
import DependencyEdge from "./DependencyEdge";

export const edgeTypes = {
  generalization: GeneralizationEdge,
  association: AssociationEdge,
  mediation: AssociationEdge, // Same component, different data
  composition: AssociationEdge, // TODO: Add diamond marker
  aggregation: AssociationEdge, // TODO: Add hollow diamond marker
  dependency: DependencyEdge,
};

export { GeneralizationEdge, AssociationEdge, DependencyEdge };
