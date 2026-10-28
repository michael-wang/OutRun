import type {FeedbackAnchor} from './l2-feedback';
/** In-memory samples of simulated driving only; never persisted wholesale. */
export class RecentDrivingHistory {
 private samples:FeedbackAnchor[]=[];
 clear(){this.samples=[];}
 due(elapsed:number){const last=this.samples.at(-1);return !last||elapsed-last.elapsedSeconds>=.099;}
 record(anchor:FeedbackAnchor,force=false){const last=this.samples.at(-1);if(!force&&last&&anchor.elapsedSeconds-last.elapsedSeconds<.099)return;this.samples.push(structuredClone(anchor));const cutoff=anchor.elapsedSeconds-15;while(this.samples.length>1&&this.samples[0].elapsedSeconds<cutoff)this.samples.shift();}
 select(reaction:FeedbackAnchor,seconds:number){if(seconds<=0)return structuredClone(reaction);const target=reaction.elapsedSeconds-seconds;let best=this.samples[0];for(const sample of this.samples){if(sample.elapsedSeconds>reaction.elapsedSeconds)break;if(!best||Math.abs(sample.elapsedSeconds-target)<Math.abs(best.elapsedSeconds-target))best=sample;}return structuredClone(best??reaction);}
 snapshot(){return structuredClone(this.samples);}
}
