/** A stage's loading art is a full-screen fixed overlay, NOT the selector.
 * Keep lifecycle transitions explicit, including after a finished race. */
export function revealStageSelect(
 loadingSurface:Pick<HTMLElement,'hidden'>,
 root:Pick<HTMLElement,'dataset'>,
){
 loadingSurface.hidden=true;
 delete root.dataset.loading;
}
