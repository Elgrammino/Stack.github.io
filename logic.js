export const STACK='4C 2H 7D 3C 4H 6D AS 5H 9S 2S QH 3D QC 8H 6S 5S 9H KC 2D JH 3S 8S 6H 10C 5D KD 2C 3H 8D 5C KS JD 8C 10S KH JC 7S 10H AD 4S 7H 4D AC 9C JS QD 7C QS 10D 6C AH 9D'.split(' ');
export const SUITS={C:['♣','крести'],D:['♦','буби'],H:['♥','черви'],S:['♠','пики']};
export const RANKS=['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
export function label(card){return card.slice(0,-1)+SUITS[card.at(-1)][0]}
export function name(card){const r=card.slice(0,-1),s=card.at(-1);return ({A:'туз',J:'валет',Q:'дама',K:'король'}[r]||r)+' '+SUITS[s][1]}
export function calculate(bottom,target,position){
 if(!STACK.includes(bottom)||!STACK.includes(target)||!Number.isInteger(position)||position<1||position>52)throw Error('Недопустимая карта или позиция');
 const top=(STACK.indexOf(bottom)+1)%52;
 const targetAt=(STACK.indexOf(target)-top+52)%52;
 const cut=(targetAt-(position-1)+52)%52;
 return {cut,cutAfter:cut?STACK[(top+cut-1)%52]:null,target,position};
}
