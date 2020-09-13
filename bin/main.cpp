// ConsoleApplication1.cpp : This file contains the 'main' function. Program execution begins and ends there.
//

/* 
    src: https://stackoverflow.com/a/30138664/1988747 
    edited to flush data to stdout and parameters to crop desktop image (from main display)
*/

#include <io.h>
#include <fcntl.h>
#include <iostream>
#include <cstdlib>
#include <chrono>
#include <thread>

#include <Wincodec.h>             // we use WIC for saving images
#include <d3d9.h>                 // DirectX 9 header
#pragma comment(lib, "d3d9.lib")  // link to DirectX 9 library

#define WIDEN2(x) L ## x
#define WIDEN(x) WIDEN2(x)
#define __WFILE__ WIDEN(__FILE__)
#define HRCHECK(__expr) {hr=(__expr);if(FAILED(hr)){wprintf(L"FAILURE 0x%08X (%i)\n\tline: %u file: '%s'\n\texpr: '" WIDEN(#__expr) L"'\n",hr, hr, __LINE__,__WFILE__);goto cleanup;}}
#define RELEASE(__p) {if(__p!=nullptr){__p->Release();__p=nullptr;}}

#define _DEBUG 0

UINT bytesPerPixel32 = 4;
UINT bytesPerPixel24 = 3;
UINT stride32;
UINT stride24;
UINT Height = 0;
UINT Width = 0;
UINT exportHeight = 0;
UINT exportWidth = 0;
IDirect3D9* d3d = nullptr;
IDirect3DDevice9* device = nullptr;
IDirect3DSurface9* surface = nullptr;
D3DPRESENT_PARAMETERS parameters = { 0 };
D3DDISPLAYMODE mode;
D3DLOCKED_RECT rc;
RECT cropRect;
UINT pitch;
LPBYTE output = nullptr;
UINT adapter = D3DADAPTER_DEFAULT;
LONG left;
LONG top; 
LONG right;
LONG bottom;
LPBYTE shot;
IWICImagingFactory* factory = nullptr;
IWICBitmapEncoder* encoder = nullptr;
IPropertyBag2* pPropertybag = NULL;
int endPixelsBuffer;
int startPixelsBuffer;
int sizePixelsBuffer;

void sendIStreamToOutput (IStream * pIStream) {

    STATSTG sts;
    pIStream->Stat(&sts, STATFLAG_DEFAULT);
    ULARGE_INTEGER uli = sts.cbSize;
    LARGE_INTEGER zero;
    zero.QuadPart = 0;
    ULONG size = (ULONG)uli.QuadPart;
    char* bits = new char[size];
    ULONG written;
    pIStream->Seek(zero, STREAM_SEEK_SET, NULL);
    pIStream->Read(bits, size, &written);
    
    std::ostream& lhs = std::cout;

    _setmode(_fileno(stdout), _O_BINARY);

#if _DEBUG == 1
    FILE* f;
    fopen_s(&f, "out.jpg", "wb");
    fwrite(bits, size, 1, f);
    fclose(f);
#else
    lhs.write(bits, size);
    fflush(stdout);
#endif

    delete[] bits;
 }

HRESULT SavePixelsToFile32bppPBGRA()
{
    HRESULT hr = S_OK;

    IWICBitmapFrameEncode* frame = nullptr;
    IWICStream* streamOut = nullptr;
    IStream * streamIn = nullptr;
    GUID pf = GUID_WICPixelFormat24bppRGB;

    HRCHECK(factory->CreateEncoder(GUID_ContainerFormatJpeg, nullptr, &encoder));
    HRCHECK(factory->CreateStream(&streamOut));
    HRCHECK(CreateStreamOnHGlobal(NULL, true, &streamIn));
    HRCHECK(streamOut->InitializeFromIStream(streamIn));
    HRCHECK(encoder->Initialize(streamOut, WICBitmapEncoderNoCache));
    HRCHECK(encoder->CreateNewFrame(&frame, &pPropertybag));
    
    {
        PROPBAG2 option = { 0 };
        option.pstrName = const_cast<LPOLESTR>(L"ImageQuality");
        VARIANT varValue;
        VariantInit(&varValue);
        varValue.vt = VT_R4;
        varValue.fltVal = 0.0; // 0 to 1; default 0.9; minimum quality
        HRCHECK(pPropertybag->Write(1, &option, &varValue));
    }

    HRCHECK(frame->Initialize(nullptr)); // we dont' use any options here
    HRCHECK(frame->SetSize(exportWidth, exportHeight));
    HRCHECK(frame->SetPixelFormat(&pf));
    HRCHECK(frame->WritePixels(exportHeight, exportWidth * bytesPerPixel24, sizePixelsBuffer, shot));
    HRCHECK(frame->Commit());
    HRCHECK(encoder->Commit());

    sendIStreamToOutput(streamOut);

cleanup:
    RELEASE(streamIn);
    RELEASE(streamOut);
    RELEASE(frame);
    RELEASE(encoder);
    RELEASE(pPropertybag);

    return hr;
}

HRESULT Direct3D9TakeScreenshots()
{
    HRESULT hr = S_OK;

    // get the data
    HRCHECK(device->GetFrontBufferData(0, surface));

    // copy it into our buffers
    HRCHECK(surface->LockRect(&rc, &cropRect, D3DLOCK_NO_DIRTY_UPDATE | D3DLOCK_READONLY));
    //CopyMemory(shot, rc.pBits, pitch * bottom - (top * pitch + bytesPerPixel * left));

    {
        LPBYTE inputBuf = (LPBYTE)rc.pBits;
        int i = 0, j = 0;

        // copy memory 32bpp to 24bpp
        for (int y = 0, i = 0, j = 0; y < (bottom - top); y++, i = y * bytesPerPixel32 * Width, j = y * stride24) {
            for (int x = left, xI = 0, xJ = 0; x < right; x++, xI = xI + bytesPerPixel32, xJ = xJ + bytesPerPixel24) {
                shot[j + xJ] = inputBuf[i + xI];
                shot[j + xJ + 1] = inputBuf[i + xI + 1];
                shot[j + xJ + 2] = inputBuf[i + xI + 2];
                // discard alpha
            }
        }
    }

    HRCHECK(surface->UnlockRect());
    
    HRCHECK(SavePixelsToFile32bppPBGRA());

cleanup:
    
    return hr;
}

int main(int argc, char ** argv)
{
    right = atoi(argv[3]);
    bottom = atoi(argv[4]);
    left = atoi(argv[1]);
    top = atoi(argv[2]);

    // init D3D and get screen size
    d3d = Direct3DCreate9(D3D_SDK_VERSION);
    d3d->GetAdapterDisplayMode(adapter, &mode);

    Height = mode.Height;
    Width = mode.Width;

    parameters.Windowed = TRUE;
    parameters.BackBufferCount = 1;
    parameters.BackBufferHeight = Height;
    parameters.BackBufferWidth = Width;
    parameters.SwapEffect = D3DSWAPEFFECT_DISCARD;
    parameters.hDeviceWindow = NULL;

    // create device & capture surface
    d3d->CreateDevice(adapter, D3DDEVTYPE_HAL, NULL, D3DCREATE_SOFTWARE_VERTEXPROCESSING, &parameters, &device);
    device->CreateOffscreenPlainSurface(Width, Height, D3DFMT_A8R8G8B8, D3DPOOL_SYSTEMMEM, &surface, nullptr);

    cropRect.left = left;
    cropRect.top = top;
    cropRect.right = right;
    cropRect.bottom = bottom;

    exportHeight = abs(cropRect.top - cropRect.bottom);
    exportWidth = abs(cropRect.left - cropRect.right);

    pitch = Width * bytesPerPixel32;

    shot = new BYTE[bytesPerPixel24 * exportHeight * exportWidth];

    BOOL coInit = CoInitialize(nullptr);

    CoCreateInstance(CLSID_WICImagingFactory, nullptr, CLSCTX_INPROC_SERVER, IID_PPV_ARGS(&factory));
    
    endPixelsBuffer = pitch * bottom;
    startPixelsBuffer = (top * pitch + bytesPerPixel32 * left);
    sizePixelsBuffer = endPixelsBuffer - startPixelsBuffer;

    stride24 = bytesPerPixel24 * exportWidth;
    stride32 = bytesPerPixel32 * exportWidth;

#if _DEBUG == 0
    while(true) {
#endif
        Direct3D9TakeScreenshots();
#if _DEBUG == 0
    }
#endif

    delete[] shot;
    RELEASE(surface);
    RELEASE(device);
    RELEASE(d3d);
    RELEASE(factory);
    if (coInit) CoUninitialize();

    return 0;
}