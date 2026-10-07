import handler from 'vinext/server/fetch-handler';
import {isOwner} from './lib/owner-auth';
export default {
 async fetch(request:Request,env:Cloudflare.Env,ctx:ExecutionContext){
  const url=new URL(request.url);
  const loginSurface=url.pathname==='/admin'||url.pathname==='/api/auth'||url.pathname.startsWith('/_next/')||url.pathname.startsWith('/assets/')||url.pathname==='/favicon.svg';
  if(env.SITE_PUBLIC!=='true'&&!loginSurface&&!await isOwner(request.headers.get('cookie'))){
   if(url.pathname.startsWith('/api'))return Response.json({error:'Private setup mode. Sign in to Joe’s dashboard.'},{status:403,headers:{'Cache-Control':'no-store'}});
   return Response.redirect(new URL('/admin',url).href,302);
  }
  const response=await handler.fetch(request,env,ctx);
  const result=new Response(response.body,response);
  result.headers.set('X-Content-Type-Options','nosniff');
  result.headers.set('Referrer-Policy','same-origin');
  result.headers.set('X-Frame-Options','DENY');
  if(env.SITE_PUBLIC!=='true')result.headers.set('X-Robots-Tag','noindex, nofollow');
  if(url.pathname.startsWith('/api')||url.pathname.startsWith('/admin'))result.headers.set('Cache-Control','no-store');
  return result;
 }
};
