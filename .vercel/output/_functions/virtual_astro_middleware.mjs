import { p as previewMiddleware } from './chunks/index_3DEUznhT.mjs';
import { ag as sequence } from './chunks/sequence_Bbl28ISp.mjs';

const onRequest$1 = previewMiddleware({
  secret: undefined                                  
});

const onRequest = sequence(
	
	onRequest$1
	
);

export { onRequest };
