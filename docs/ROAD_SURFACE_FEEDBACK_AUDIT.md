# Roadside surface and feedback audit

This is an inventory, not a new material/physics implementation.

| Concern | Current source and behavior | Gap |
| --- | --- | --- |
| Road geometry | Authored road JSON and shared main/Worker samplers provide position, width, banking and curvature. | No unified per-section shoulder/barrier material contract. |
| Shoulder and bounds | `coast-layout.ts`, `coast-roadside-layout.ts` contain typed TS ranges, barrier styles, drain variants and cross-section queries. `coastDriveBounds` supplies physical edges. | Data exists, but is largely TS constants and formulas rather than a single road-side profile. |
| Visual barriers | `coast-resort.ts` selects instanced rails/blocks from barrier style. `coast-dusk-shadows.ts` separately builds shadow footprints. Beach visual hiding is independent of bounds. | Render visibility, collision presence and impact material are not explicit independent data fields. |
| Contact material | `coast-contact-feedback.ts` derives metal/concrete/soft from barrier styles and finite stone contacts. `main.ts` selects sounds, metal sparks or neutral impact puffs. | Material inference is distributed. Hidden beach rails still produce the existing metal response. |
| Rebound/deceleration | `guardrail-contact.ts` computes severity, speed loss, push, yaw and roll using shared coefficients. | Response is not selected by material. Do not describe metal vs concrete as different driving physics. |
| Roadside dust/audio | `main.ts` checks off-road wheel contact and gap, calls generic surface sound and sets dust tint using scene weights; `tire-effects.ts` emits dust near contact. | Sand/grass/gravel are not distinct contact material IDs driving sound and particle profiles. `TireContact.surface` is a coordinate, not a material enum. |

Changing a JSON route alone cannot currently implement every requested material effect. A small follow-up should introduce a shared sampled side profile with shoulder material, barrier kind, visual visibility, collision presence and impact material. Existing coefficients should initially remain the default response; keep tuning separate from data migration. Both main and Worker must consume the same profile. Render, dust/audio and impact code can then use that result rather than infer independently.

First useful contracts: an invisible collision wall stays solid; an opening's visual/physical behavior is explicit; the same contacted material drives sound and particles; transition boundaries agree between main/Worker. This should be incremental, with existing handling unchanged until Michael authorizes material-specific driving response. No broad refactor was performed in this delivery.
